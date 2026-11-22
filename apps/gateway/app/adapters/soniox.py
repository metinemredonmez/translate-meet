"""Soniox real-time STT with built-in two-way translation, plus optional streaming TTS for the output.

STT tokens carry translation_status: "original" (spoken), "translation" (translated) or "none".
Final tokens never change; non-final tokens are replaced on every response.
"""

import asyncio
import contextlib
import json
import re
import uuid

from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import WebSocketException

from app.adapters.common import OUTPUT_SAMPLE_RATE, EventQueue, ProviderError, text_not_supported

STT_URL = "wss://stt-rt.soniox.com/transcribe-websocket"
TTS_URL = "wss://tts-rt.soniox.com/tts-websocket"
END_TOKEN = "<end>"  # noqa: S105 - Soniox endpoint marker, not a secret
_SENTENCE_END = re.compile(r"[.!?…。？！]\s*$")


class SonioxTTS:
    """Synthesizes one text at a time into PCM16 @ 24 kHz chunks over a shared connection."""

    def __init__(
        self, api_key: str, model: str, voice: str, url: str = TTS_URL, timeout: float = 10.0
    ) -> None:
        self._key, self._model, self._voice, self._url, self._timeout = api_key, model, voice, url, timeout
        self._ws: ClientConnection | None = None
        self._lock = asyncio.Lock()

    async def _connection(self) -> ClientConnection:
        if self._ws is None:
            try:
                self._ws = await asyncio.wait_for(
                    connect(self._url, additional_headers={"Authorization": f"Bearer {self._key}"}),
                    self._timeout,
                )
            except (OSError, TimeoutError, WebSocketException):
                raise ProviderError("soniox_tts_connect_failed") from None
        return self._ws

    async def synthesize(self, text: str, language: str):
        async with self._lock:  # one stream at a time keeps ordering simple
            ws = await self._connection()
            stream_id = uuid.uuid4().hex[:12]
            try:
                await ws.send(
                    json.dumps(
                        {
                            "model": self._model,
                            "language": language,
                            "voice": self._voice,
                            "audio_format": "pcm_s16le",
                            "sample_rate": OUTPUT_SAMPLE_RATE,
                            "stream_id": stream_id,
                        }
                    )
                )
                await ws.send(json.dumps({"text": text, "text_end": True, "stream_id": stream_id}))
                while True:
                    msg = json.loads(await asyncio.wait_for(ws.recv(), self._timeout))
                    if msg.get("stream_id") not in (None, stream_id):
                        continue
                    if msg.get("error_code") or msg.get("error_type"):
                        raise ProviderError("soniox_tts_error")
                    if msg.get("audio"):
                        yield msg["audio"]
                    if msg.get("audio_end") or msg.get("terminated"):
                        return
            except (WebSocketException, TimeoutError, json.JSONDecodeError):
                self._ws = None
                raise ProviderError("soniox_tts_failed") from None

    async def close(self) -> None:
        if self._ws is not None:
            with contextlib.suppress(Exception):
                await self._ws.close()
            self._ws = None


class SonioxTwoWay:
    name = "soniox_two_way"

    def __init__(
        self,
        api_key: str,
        model: str,
        url: str = STT_URL,
        tts: SonioxTTS | None = None,
        timeout: float = 10.0,
    ) -> None:
        self._key, self._model, self._url, self._tts, self._timeout = api_key, model, url, tts, timeout
        self._ws: ClientConnection | None = None
        self._queue = EventQueue()
        self._reader: asyncio.Task | None = None
        self._speaker: asyncio.Task | None = None
        self._tts_queue: asyncio.Queue[tuple[str, str] | None] = asyncio.Queue()
        self._final_original = ""
        self._final_translation = ""
        self._source_lang = ""
        self._target_lang = ""
        self._last_detected = ""

    def _config(self, source: str, target: str, mode: str) -> dict:
        translation = (
            {"type": "two_way", "language_a": source, "language_b": target}
            if mode == "two_way"
            else {"type": "one_way", "target_language": target}
        )
        return {
            "model": self._model,
            "audio_format": "pcm_s16le",
            "sample_rate": 16_000,
            "num_channels": 1,
            "language_hints": [source, target],
            "enable_language_identification": True,
            "enable_endpoint_detection": True,
            "translation": translation,
        }

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None:
        try:
            # Key in the Authorization header; the deprecated api_key config field is not used.
            self._ws = await asyncio.wait_for(
                connect(self._url, additional_headers={"Authorization": f"Bearer {self._key}"}),
                self._timeout,
            )
            await self._ws.send(json.dumps(self._config(source_lang, target_lang, mode)))
        except (OSError, TimeoutError, WebSocketException):
            raise ProviderError("soniox_connect_failed") from None
        self._reader = asyncio.create_task(self._read())
        if self._tts is not None:
            self._speaker = asyncio.create_task(self._speak())

    def _flush(self) -> None:
        if self._final_translation.strip():
            caption = {
                "type": "final_caption",
                "source_text": self._final_original.strip(),
                "translated_text": self._final_translation.strip(),
                "source_lang": self._source_lang or "und",
                "target_lang": self._target_lang or "und",
            }
            self._queue.put(caption)
            if self._tts is not None:
                self._tts_queue.put_nowait((caption["translated_text"], caption["target_lang"]))
        self._final_original = self._final_translation = ""

    def _handle(self, message: dict) -> bool:
        if message.get("error_code") or message.get("error_type"):
            raise ProviderError(f"soniox_{message.get('error_type') or 'error'}")
        pending_original = ""
        pending_lang = ""
        flush = False
        for tok in message.get("tokens", []):
            text = tok.get("text", "")
            if text == END_TOKEN:
                flush = flush or tok.get("is_final", False)
                continue
            status = tok.get("translation_status", "none")
            if status == "translation":
                if tok.get("is_final"):
                    self._final_translation += text
                    self._target_lang = tok.get("language") or self._target_lang
                    self._source_lang = tok.get("source_language") or self._source_lang
                continue
            lang = tok.get("language") or ""
            if tok.get("is_final"):
                self._final_original += text
                if lang:
                    self._source_lang = lang
            else:
                pending_original += text
            pending_lang = lang or pending_lang
        if pending_lang and pending_lang != self._last_detected:
            self._last_detected = pending_lang
            self._queue.put({"type": "detected_language", "lang": pending_lang})
        if pending_original or message.get("tokens"):
            live = (self._final_original + pending_original).strip()
            if live:
                self._queue.put(
                    {
                        "type": "partial_caption",
                        "text": live,
                        "lang": pending_lang or self._source_lang or "und",
                    }
                )
        if flush or _SENTENCE_END.search(self._final_translation):
            self._flush()
        if message.get("finished"):
            self._flush()
            return True
        return False

    async def _read(self) -> None:
        assert self._ws is not None
        try:
            async for raw in self._ws:
                if self._handle(json.loads(raw)):
                    break
        except ProviderError as exc:
            self._queue.fail(exc)
            return
        except (WebSocketException, json.JSONDecodeError, OSError):
            self._queue.fail(ProviderError("soniox_stream_failed"))
            return
        self._tts_queue.put_nowait(None)

    async def _speak(self) -> None:
        assert self._tts is not None
        while (item := await self._tts_queue.get()) is not None:
            text, lang = item
            try:
                async for chunk in self._tts.synthesize(text, lang):
                    self._queue.put(
                        {
                            "type": "audio_chunk",
                            "data": chunk,
                            "lang": lang,
                            "sample_rate": OUTPUT_SAMPLE_RATE,
                        }
                    )
            except ProviderError as exc:
                # Captions keep flowing even if speech synthesis fails.
                self._queue.put({"type": "error", "code": str(exc), "message": "speech output unavailable"})

    async def send_audio(self, pcm: bytes) -> None:
        if self._ws is None:
            raise ProviderError("soniox_not_started")
        try:
            await self._ws.send(pcm)  # binary frame = raw PCM s16le 16 kHz mono
        except WebSocketException:
            raise ProviderError("soniox_send_failed") from None

    async def send_text(self, text: str) -> None:
        text_not_supported(self._queue)

    def events(self):
        return self._queue.stream()

    async def close(self) -> None:
        if self._ws is not None:
            with contextlib.suppress(Exception):
                await self._ws.send("")  # empty text frame = end of audio
                if self._reader is not None:
                    await asyncio.wait_for(asyncio.shield(self._reader), 3.0)
            with contextlib.suppress(Exception):
                await self._ws.close()
        for task in (self._reader, self._speaker):
            if task is not None:
                task.cancel()
        if self._tts is not None:
            await self._tts.close()
        self._queue.end()
