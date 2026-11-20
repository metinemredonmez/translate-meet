from typing import Protocol

from app.config import Settings


class Translator(Protocol):
    name: str

    def translate(self, text: str, source_lang: str, target_lang: str) -> str: ...


class MockTranslator:
    """Deterministic translator for development and tests. Real providers arrive in sprint 2."""

    name = "mock"

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        return f"[{source_lang}->{target_lang}] {text}"


def build_translator(settings: Settings) -> Translator:
    if settings.translator_provider == "mock":
        return MockTranslator()
    raise RuntimeError(f"Unknown translator provider: {settings.translator_provider}")
