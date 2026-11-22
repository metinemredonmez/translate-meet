"""Gemini 3.5 Live Translate over the raw Live API WebSocket.

One Gemini session has exactly one target language. For two-way conversations we open two sessions
(target A and target B) and feed both the same audio; with echoTargetLanguage=false each session stays
silent for speech that is already in its target language, so only the foreign side gets translated.
"""

import asyncio
import base64
import contextlib
import json

from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import WebSocketException

from app.adapters.common import OUTPUT_SAMPLE_RATE, EventQueue, ProviderError, text_not_supported

DEFAULT_URL = (
    "wss://generativelanguage.googleapis.com/ws/"
    "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
)


class _Leg:
    """One upstream session translating into a single target language."""

    def __init__(self, target: str, primary: bool) -> None:
        self.target, self.primary = target, primary
        self.ws: ClientConnection | None = None
        self.source_text = ""
        self.translated_text = ""
        self.source_lang = ""


class GeminiLiveTranslate:
    name = "gemini_live"

    def __init__(
        self, api_key: str, model: str, url: str = DEFAULT_URL, connect_timeout: float = 10.0
    ) -> None:
        self._key, self._model, self._url, self._timeout = api_key, model, url, connect_timeout
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
        for part in (content.get("modelTurn") or {}).get("parts", []):
            if (blob := part.get("inlineData")) and blob.get("data"):
                self._queue.put(
                    {
                        "type": "audio_chunk",
                        "data": blob["data"],
                        "lang": leg.target,
                        "sample_rate": OUTPUT_SAMPLE_RATE,
                    }
                )
        if content.get("turnComplete") or content.get("generationComplete"):
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
            leg.source_text = leg.translated_text = ""

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
