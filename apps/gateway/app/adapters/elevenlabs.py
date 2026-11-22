"""Cascade: ElevenLabs Scribe realtime STT -> text translation (API provider chain) -> ElevenLabs TTS.

Observed on the real API (2026-11-22): `partial_transcript` carries the whole running text plus
`language_code`; a segment is finalised only after the client sends `commit: true`, then
`committed_transcript_with_timestamps` (with language) and `committed_transcript` arrive.
We commit after a short client-side silence (energy VAD).
"""

import array
import asyncio
import base64
import contextlib
import json
from collections.abc import Awaitable, Callable

import httpx
from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import WebSocketException

from app.adapters.common import OUTPUT_SAMPLE_RATE, EventQueue, ProviderError, text_not_supported

STT_URL = "wss://api.elevenlabs.io/v1/speech-to-text/realtime"
TTS_BASE_URL = "https://api.elevenlabs.io"
INPUT_RATE = 16_000

# Scribe may report ISO 639-3; we speak ISO 639-1 everywhere else.
_LANG3 = {
    "tur": "tr",
    "eng": "en",
    "ara": "ar",
    "deu": "de",
    "ger": "de",
    "rus": "ru",
    "fra": "fr",
    "fre": "fr",
    "spa": "es",
    "ita": "it",
    "fas": "fa",
    "per": "fa",
    "nld": "nl",
    "dut": "nl",
    "ukr": "uk",
}

TranslateFn = Callable[[str, str, str], Awaitable[str]]


def normalize_lang(code: str | None) -> str:
    if not code:
        return ""
    code = code.lower().split("-")[0]
    return _LANG3.get(code, code)


def _rms(pcm: bytes) -> float:
    samples = array.array("h", pcm[: len(pcm) - len(pcm) % 2])
    if not samples:
        return 0.0
    return (sum(s * s for s in samples) / len(samples)) ** 0.5


class ElevenLabsCascade:
    name = "elevenlabs_cascade"

    def __init__(
        self,
        api_key: str,
        translate: TranslateFn,
        voice_id: str,
        stt_model: str = "scribe_v2_realtime",
        tts_model: str = "eleven_flash_v2_5",
        stt_url: str = STT_URL,
        tts_base_url: str = TTS_BASE_URL,
        commit_silence_ms: int = 700,
        speech_rms: float = 300.0,
        timeout: float = 10.0,
        tts_transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._key, self._translate, self._voice = api_key, translate, voice_id
        self._stt_model, self._tts_model, self._stt_url = stt_model, tts_model, stt_url
        self._commit_silence_ms, self._speech_rms, self._timeout = commit_silence_ms, speech_rms, timeout
        self._tts = httpx.AsyncClient(
            base_url=tts_base_url, timeout=timeout, headers={"xi-api-key": api_key}, transport=tts_transport
        )
        self._ws: ClientConnection | None = None
        self._queue = EventQueue()
        self._segments: asyncio.Queue[tuple[str, str] | None] = asyncio.Queue()
        self._tasks: list[asyncio.Task] = []
        self._pair: tuple[str, str] = ("", "")
        self._mode = "two_way"
        self._last_detected = ""
        self._pending_lang = ""
        self._speaking = False
        self._silence_ms = 0.0

    # ------------------------------------------------------------ lifecycle

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None:
        self._pair, self._mode = (source_lang, target_lang), mode
        query = f"?model_id={self._stt_model}&audio_format=pcm_{INPUT_RATE}&include_language_detection=true"
        try:
            self._ws = await asyncio.wait_for(
                connect(self._stt_url + query, additional_headers={"xi-api-key": self._key}), self._timeout
            )
            hello = json.loads(await asyncio.wait_for(self._ws.recv(), self._timeout))
        except (OSError, TimeoutError, WebSocketException, json.JSONDecodeError):
            await self._tts.aclose()
            raise ProviderError("elevenlabs_connect_failed") from None
        if hello.get("message_type") != "session_started":
            await self.close()
            raise ProviderError("elevenlabs_session_rejected")
        self._tasks = [asyncio.create_task(self._read()), asyncio.create_task(self._work())]

    async def close(self) -> None:
        for task in self._tasks:
            task.cancel()
        if self._ws is not None:
            with contextlib.suppress(Exception):
                await self._ws.close()
        with contextlib.suppress(Exception):
            await self._tts.aclose()
        self._queue.end()

    def events(self):
        return self._queue.stream()

    async def send_text(self, text: str) -> None:
        text_not_supported(self._queue)

    # ------------------------------------------------------------ audio in

    async def send_audio(self, pcm: bytes) -> None:
        if self._ws is None:
            raise ProviderError("elevenlabs_not_started")
        chunk_ms = len(pcm) / (INPUT_RATE * 2) * 1000
        if _rms(pcm) >= self._speech_rms:
            self._speaking, self._silence_ms = True, 0.0
            commit = False
        elif self._speaking:
            self._silence_ms += chunk_ms
            commit = self._silence_ms >= self._commit_silence_ms
            if commit:
                self._speaking, self._silence_ms = False, 0.0
        else:
            commit = False
        message = {
            "message_type": "input_audio_chunk",
            "audio_base_64": base64.b64encode(pcm).decode(),
            "commit": commit,
            "sample_rate": INPUT_RATE,
        }
        try:
            await self._ws.send(json.dumps(message))
        except WebSocketException:
            raise ProviderError("elevenlabs_send_failed") from None

    # ------------------------------------------------------------ transcripts

    def _direction(self, spoken: str) -> tuple[str, str] | None:
        a, b = self._pair
        if self._mode == "one_way":
            return (spoken or a, b) if spoken != b else None
        if spoken == a:
            return a, b
        if spoken == b:
            return b, a
        return a, b  # unknown/other language: assume the session's source side

    def _handle(self, message: dict) -> None:
        kind = message.get("message_type", "")
        if "error" in kind or message.get("error"):
            raise ProviderError(f"elevenlabs_{kind or 'error'}")
        lang = normalize_lang(message.get("language_code"))
        if kind == "partial_transcript":
            if lang and lang != self._last_detected:
                self._last_detected = lang
                self._queue.put({"type": "detected_language", "lang": lang})
            if message.get("text"):
                self._queue.put({"type": "partial_caption", "text": message["text"], "lang": lang or "und"})
        elif kind == "committed_transcript_with_timestamps":
            self._pending_lang = lang
        elif kind == "committed_transcript":
            text = (message.get("text") or "").strip()
            if text:
                self._segments.put_nowait((text, self._pending_lang or self._last_detected))
            self._pending_lang = ""

    async def _read(self) -> None:
        assert self._ws is not None
        try:
            async for raw in self._ws:
                self._handle(json.loads(raw))
        except ProviderError as exc:
            self._queue.fail(exc)
        except (WebSocketException, json.JSONDecodeError, OSError):
            self._queue.fail(ProviderError("elevenlabs_stream_failed"))
        else:
            self._queue.fail(ProviderError("elevenlabs_stream_closed"))

    # ------------------------------------------------------------ translate + speak (in order)

    async def _work(self) -> None:
        while (item := await self._segments.get()) is not None:
            text, spoken = item
            direction = self._direction(spoken)
            if direction is None:
                continue
            src, tgt = direction
            try:
                translated = await self._translate(text, src, tgt)
            except ProviderError as exc:
                self._queue.put({"type": "error", "code": str(exc), "message": "translation unavailable"})
                continue
            self._queue.put(
                {
                    "type": "final_caption",
                    "source_text": text,
                    "translated_text": translated,
                    "source_lang": src,
                    "target_lang": tgt,
                }
            )
            try:
                await self._speak(translated, tgt)
            except ProviderError as exc:
                self._queue.put({"type": "error", "code": str(exc), "message": "speech output unavailable"})

    async def _speak(self, text: str, lang: str) -> None:
        body = {"text": text, "model_id": self._tts_model, "language_code": lang}
        url = f"/v1/text-to-speech/{self._voice}/stream?output_format=pcm_{OUTPUT_SAMPLE_RATE}"
        carry = b""
        try:
            async with self._tts.stream("POST", url, json=body) as res:
                if res.status_code != 200:
                    raise ProviderError(f"elevenlabs_tts_http_{res.status_code}")
                async for chunk in res.aiter_bytes():
                    data = carry + chunk
                    cut = len(data) - len(data) % 2  # keep PCM16 frames whole
                    carry = data[cut:]
                    if cut:
                        self._queue.put(
                            {
                                "type": "audio_chunk",
                                "data": base64.b64encode(data[:cut]).decode(),
                                "lang": lang,
                                "sample_rate": OUTPUT_SAMPLE_RATE,
                            }
                        )
        except httpx.HTTPError:
            raise ProviderError("elevenlabs_tts_failed") from None


class ApiTextTranslator:
    """Calls the API's /internal/translate so live segments use the same provider chain (Kaptan first)."""

    def __init__(
        self,
        base_url: str,
        service_token: str,
        timeout: float = 10.0,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url,
            timeout=timeout,
            headers={"X-Internal-Token": service_token},
            transport=transport,
        )

    async def __call__(self, text: str, source_lang: str, target_lang: str) -> str:
        try:
            res = await self._client.post(
                "/internal/translate",
                json={"text": text, "source_lang": source_lang, "target_lang": target_lang},
            )
        except httpx.HTTPError:
            raise ProviderError("translate_unreachable") from None
        if res.status_code != 200:
            raise ProviderError(f"translate_http_{res.status_code}")
        return res.json()["translated_text"]
