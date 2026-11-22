"""Realtime translation providers behind one interface. Real adapters are skeletons until sprint 2."""

import asyncio
import re
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass
from typing import Protocol

from app.adapters.gemini import GeminiLiveTranslate
from app.adapters.soniox import SonioxTTS, SonioxTwoWay
from app.config import Settings

# OpenAI gpt-realtime-translate documented target languages (no Turkish).
OPENAI_OUTPUT_LANGS = frozenset(
    {"es", "pt", "fr", "ja", "ru", "zh", "de", "ko", "hi", "id", "vi", "it", "en"}
)


class RealtimeTranslator(Protocol):
    name: str

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None: ...
    async def send_audio(self, pcm: bytes) -> None: ...
    async def send_text(self, text: str) -> None: ...
    def events(self) -> AsyncIterator[dict]: ...
    async def close(self) -> None: ...


_TR_CHARS = re.compile(r"[çğıöşüÇĞİÖŞÜ]")


class MockTranslator:
    """Deterministic provider for development/tests: echoes text with a language tag."""

    name = "mock"

    def __init__(self) -> None:
        self._queue: asyncio.Queue[dict | None] = asyncio.Queue()
        self._src = self._tgt = ""
        self._mode = "two_way"
        self._audio_bytes = 0

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None:
        self._src, self._tgt, self._mode = source_lang, target_lang, mode

    def _direction(self, text: str) -> tuple[str, str]:
        if self._mode == "two_way" and "tr" in (self._src, self._tgt):
            spoken = (
                "tr"
                if _TR_CHARS.search(text)
                else next(lang for lang in (self._src, self._tgt) if lang != "tr")
            )
            other = self._tgt if spoken == self._src else self._src
            return spoken, other
        return self._src, self._tgt

    async def send_text(self, text: str) -> None:
        src, tgt = self._direction(text)
        await self._queue.put({"type": "detected_language", "lang": src})
        await self._queue.put(
            {"type": "partial_caption", "text": text[: max(1, len(text) // 2)], "lang": src}
        )
        await self._queue.put(
            {
                "type": "final_caption",
                "source_text": text,
                "translated_text": f"[{src}->{tgt}] {text}",
                "source_lang": src,
                "target_lang": tgt,
            }
        )

    async def send_audio(self, pcm: bytes) -> None:
        self._audio_bytes += len(pcm)
        if self._audio_bytes >= 32_000:  # ~1 s of 16 kHz PCM16
            self._audio_bytes = 0
            await self._queue.put({"type": "partial_caption", "text": "…", "lang": self._src})

    async def events(self) -> AsyncIterator[dict]:
        while (event := await self._queue.get()) is not None:
            yield event

    async def close(self) -> None:
        await self._queue.put(None)


class _NotYetImplemented:
    """Base for adapters whose network code is not written yet (OpenAI: sprint 3, TR->EN only)."""

    name = "unset"

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key, self._model = api_key, model

    async def start(self, source_lang: str, target_lang: str, mode: str) -> None:
        raise NotImplementedError(f"{self.name} adapter not implemented yet")

    async def send_audio(self, pcm: bytes) -> None:
        raise NotImplementedError

    async def send_text(self, text: str) -> None:
        raise NotImplementedError

    async def events(self) -> AsyncIterator[dict]:
        raise NotImplementedError
        yield {}  # pragma: no cover

    async def close(self) -> None:
        return None


class OpenAIRealtimeTranslate(_NotYetImplemented):
    name = "openai_realtime"


@dataclass(frozen=True)
class ProviderSpec:
    name: str
    factory: Callable[[], RealtimeTranslator]
    output_langs: frozenset[str] | None  # None = any


def build_registry(settings: Settings) -> dict[str, ProviderSpec]:
    """Only providers that are configured (key present / mock allowed) are registered."""
    registry: dict[str, ProviderSpec] = {}
    if settings.enable_mock_provider:
        registry["mock"] = ProviderSpec("mock", MockTranslator, None)
    if settings.gemini_api_key:
        g_key, g_model, g_url = (
            settings.gemini_api_key.get_secret_value(),
            settings.gemini_model,
            settings.gemini_ws_url,
        )
        registry["gemini_live"] = ProviderSpec(
            "gemini_live", lambda: GeminiLiveTranslate(g_key, g_model, url=g_url), None
        )
    if settings.soniox_api_key and settings.soniox_model:
        s_key = settings.soniox_api_key.get_secret_value()

        def soniox() -> SonioxTwoWay:
            tts = (
                SonioxTTS(
                    s_key, settings.soniox_tts_model, settings.soniox_tts_voice, url=settings.soniox_tts_url
                )
                if settings.soniox_tts_voice
                else None
            )
            return SonioxTwoWay(s_key, settings.soniox_model, url=settings.soniox_stt_url, tts=tts)

        registry["soniox_two_way"] = ProviderSpec("soniox_two_way", soniox, None)
    if settings.openai_api_key:
        key, model = settings.openai_api_key.get_secret_value(), settings.openai_model
        registry["openai_realtime"] = ProviderSpec(
            "openai_realtime", lambda: OpenAIRealtimeTranslate(key, model), OPENAI_OUTPUT_LANGS
        )
    return registry
