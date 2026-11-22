"""Gemini 3.5 Live Translate over the raw Live API WebSocket.

One Gemini session has exactly one target language. For two-way conversations we open two sessions
(target A and target B) and feed both the same audio; with echoTargetLanguage=false each session stays
silent for speech that is already in its target language, so only the foreign side gets translated.
"""

import array
import asyncio
import base64
import contextlib
import json
import re
import time

from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import WebSocketException

from app.adapters.common import OUTPUT_SAMPLE_RATE, EventQueue, ProviderError, text_not_supported

DEFAULT_URL = (
    "wss://generativelanguage.googleapis.com/ws/"
    "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
)


_SENTENCE_END = re.compile(r"[.!?…。？！]\s*$")
SILENCE_PEAK = 64  # PCM16 peak below this is treated as silence and not forwarded


def _is_silent(b64: str) -> bool:
    samples = array.array("h", base64.b64decode(b64))
    return not samples or max(abs(min(samples)), abs(max(samples))) < SILENCE_PEAK


class _Leg:
    """One upstream session translating into a single target language."""

    def __init__(self, target: str, primary: bool) -> None:
        self.target, self.primary = target, primary
        self.ws: ClientConnection | None = None
        self.source_text = ""
        self.translated_text = ""
        self.source_lang = ""
        self.last_output = 0.0


class GeminiLiveTranslate:
    name = "gemini_live"

    def __init__(
        self,
        api_key: str,
        model: str,
        url: str = DEFAULT_URL,
        connect_timeout: float = 10.0,
        idle_flush_seconds: float = 1.2,
    ) -> None:
        self._key, self._model, self._url, self._timeout = api_key, model, url, connect_timeout
        self._idle_flush = idle_flush_seconds
        self._legs: list[_Leg] = []
        self._tasks: list[asyncio.Task] = []
        self._queue = EventQueue()
        self._last_detected = ""

    def _setup_message(self, target: str) -> dict:
        return {
            "setup": {
                "model": f"models/{self._model}",
                "inputAudioTranscription": {},
                "outputAudioTranscription": {},
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "translationConfig": {"targetLanguageCode": target, "echoTargetLanguage": False},
                },
            }
        }

    async def _open(self, leg: _Leg) -> None:
        try:
            # The key travels as a query parameter (documented); never log this URL.
            leg.ws = await asyncio.wait_for(
                connect(f"{self._url}?key={self._key}", max_size=4 * 1024 * 1024), self._timeout
            )
            await leg.ws.send(json.dumps(self._setup_message(leg.target)))
            ack = json.loads(await asyncio.wait_for(leg.ws.recv(), self._timeout))
        except (OSError, TimeoutError, WebSocketException, json.JSONDecodeError):
            raise ProviderError("gemini_connect_failed") from None
        if "setupComplete" not in ack:
            raise ProviderError("gemini_setup_rejected")

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None:
        targets = [target_lang, source_lang] if mode == "two_way" else [target_lang]
        self._legs = [_Leg(t, primary=i == 0) for i, t in enumerate(targets)]
        try:
            await asyncio.gather(*(self._open(leg) for leg in self._legs))
        except ProviderError:
            await self.close()
            raise
        self._tasks = [asyncio.create_task(self._read(leg)) for leg in self._legs]
        self._tasks.append(asyncio.create_task(self._idle_flusher()))

    def _flush(self, leg: _Leg) -> None:
        if leg.translated_text.strip():
            self._queue.put(
                {
                    "type": "final_caption",
                    "source_text": leg.source_text.strip(),
                    "translated_text": leg.translated_text.strip(),
                    "source_lang": leg.source_lang or "und",
                    "target_lang": leg.target,
                }
            )
            leg.source_text = ""
        leg.translated_text = ""

    async def _idle_flusher(self) -> None:
        # Live Translate streams continuously and never sends turnComplete; a pause in the
        # translated transcript closes the caption.
        while True:
            await asyncio.sleep(min(0.3, self._idle_flush / 2))
            now = time.monotonic()
            for leg in self._legs:
                if leg.translated_text and now - leg.last_output >= self._idle_flush:
                    self._flush(leg)

    def _handle(self, leg: _Leg, message: dict) -> None:
        if "error" in message:
            raise ProviderError("gemini_upstream_error")
        content = message.get("serverContent")
        if not content:
            return
        if (src := content.get("inputTranscription")) and src.get("text"):
            leg.source_text += src["text"]
            lang = src.get("languageCode") or ""
            if lang:
                leg.source_lang = lang
            # Both legs transcribe the same audio; only the primary leg reports input captions.
            if leg.primary:
                if lang and lang != self._last_detected:
                    self._last_detected = lang
                    self._queue.put({"type": "detected_language", "lang": lang})
                self._queue.put({"type": "partial_caption", "text": leg.source_text, "lang": lang or "und"})
        if (out := content.get("outputTranscription")) and out.get("text"):
            leg.translated_text += out["text"]
            leg.last_output = time.monotonic()
        for part in (content.get("modelTurn") or {}).get("parts", []):
            blob = part.get("inlineData") or {}
            if blob.get("data") and not _is_silent(blob["data"]):
                self._queue.put(
                    {
                        "type": "audio_chunk",
                        "data": blob["data"],
                        "lang": leg.target,
                        "sample_rate": OUTPUT_SAMPLE_RATE,
                    }
                )
        if (
            content.get("turnComplete")
            or content.get("generationComplete")
            or _SENTENCE_END.search(leg.translated_text)
        ):
            self._flush(leg)

    async def _read(self, leg: _Leg) -> None:
        assert leg.ws is not None
        try:
            async for raw in leg.ws:
                self._handle(leg, json.loads(raw))
        except ProviderError as exc:
            self._queue.fail(exc)
        except (WebSocketException, json.JSONDecodeError, OSError):
            self._queue.fail(ProviderError("gemini_stream_failed"))
        else:
            self._queue.fail(ProviderError("gemini_stream_closed"))

    async def send_audio(self, pcm: bytes) -> None:
        payload = json.dumps(
            {
                "realtimeInput": {
                    "audio": {"data": base64.b64encode(pcm).decode(), "mimeType": "audio/pcm;rate=16000"}
                }
            }
        )
        try:
            await asyncio.gather(*(leg.ws.send(payload) for leg in self._legs if leg.ws is not None))
        except WebSocketException:
            raise ProviderError("gemini_send_failed") from None

    async def send_text(self, text: str) -> None:
        text_not_supported(self._queue)

    def events(self):
        return self._queue.stream()

    async def close(self) -> None:
        for task in self._tasks:
            task.cancel()
        for leg in self._legs:
            if leg.ws is not None:
                with contextlib.suppress(Exception):
                    await leg.ws.close()
        self._queue.end()
