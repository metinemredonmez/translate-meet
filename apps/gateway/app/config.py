from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_PREFIX = "dev-only"

DEFAULT_ROUTES: dict[str, list[str]] = {
    # Direction-specific rows win over "*". OpenAI realtime-translate is only valid where the
    # TARGET is one of its 13 output languages (no Turkish output) - enforced in routing.py.
    "*": ["gemini_live", "soniox_two_way", "mock"],
    "tr->en": ["gemini_live", "soniox_two_way", "openai_realtime", "mock"],
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="TM_", env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    jwt_issuer: str = "translate-meet-api"
    rt_token_secret: SecretStr = SecretStr(f"{_DEV_PREFIX}-realtime-secret-not-for-production")

    api_internal_url: str = "http://127.0.0.1:8000"
    internal_service_token: SecretStr = SecretStr(f"{_DEV_PREFIX}-internal-token-not-for-production")

    allowed_origins: list[str] = []  # native apps send no Origin; browsers must match this list
    auth_timeout_seconds: float = 5.0
    max_message_bytes: int = 48_000
    max_messages_per_second: int = 50
    quota_tick_seconds: int = 10
    tick_interval_override: float | None = None  # tests only

    routes: dict[str, list[str]] = DEFAULT_ROUTES
    enable_mock_provider: bool = True

    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3.5-live-translate-preview"
    gemini_ws_url: str = (
        "wss://generativelanguage.googleapis.com/ws/"
        "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
    )
    soniox_api_key: SecretStr | None = None
    soniox_model: str = "stt-rt-v6"
    soniox_stt_url: str = "wss://stt-rt.soniox.com/transcribe-websocket"  # EU: stt-rt.eu.soniox.com
    soniox_tts_url: str = "wss://tts-rt.soniox.com/tts-websocket"  # EU: tts-rt.eu.soniox.com
    soniox_tts_model: str = "tts-rt-v2"
    soniox_tts_voice: str = ""  # empty = captions only, no synthesized speech
    openai_api_key: SecretStr | None = None
    openai_model: str = "gpt-realtime-translate"

    def assert_safe(self) -> None:
        if self.env != "prod":
            return
        problems: list[str] = []
        for name in ("rt_token_secret", "internal_service_token"):
            value = getattr(self, name).get_secret_value()
            if value.startswith(_DEV_PREFIX) or len(value) < 32:
                problems.append(f"{name} is a default or shorter than 32 chars")
        if self.enable_mock_provider:
            problems.append("mock provider must be disabled in prod")
        if self.tick_interval_override is not None:
            problems.append("tick_interval_override is test-only")
        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()
