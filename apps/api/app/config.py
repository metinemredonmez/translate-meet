from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_PREFIX = "dev-only"


class Settings(BaseSettings):
    """Runtime settings from TM_* env vars. Model/provider names are settings, not code."""

    model_config = SettingsConfigDict(env_prefix="TM_", env_file=".env", extra="ignore")

    env: Literal["dev", "test", "prod"] = "dev"
    database_url: str = "sqlite:///./dev.db"

    jwt_issuer: str = "translate-meet-api"
    jwt_secret: SecretStr = SecretStr(f"{_DEV_PREFIX}-access-secret-not-for-production")
    rt_token_secret: SecretStr = SecretStr(f"{_DEV_PREFIX}-realtime-secret-not-for-production")
    internal_service_token: SecretStr = SecretStr(f"{_DEV_PREFIX}-internal-token-not-for-production")
    access_ttl_seconds: int = 900
    refresh_ttl_seconds: int = 60 * 60 * 24 * 30
    rt_token_ttl_seconds: int = 60

    apple_client_ids: list[str] = []
    google_client_ids: list[str] = []

    gateway_public_url: str = "ws://localhost:8001/v1/converse"

    daily_text_chars: int = 20_000
    daily_realtime_seconds: int = 300

    translator_provider: str = "mock"

    def assert_safe(self) -> None:
        """KEY-01 / OPS-01: refuse to start in prod with insecure defaults."""
        if self.env != "prod":
            return
        problems: list[str] = []
        for name in ("jwt_secret", "rt_token_secret", "internal_service_token"):
            value = getattr(self, name).get_secret_value()
            if value.startswith(_DEV_PREFIX) or len(value) < 32:
                problems.append(f"{name} is a default or shorter than 32 chars")
        if self.jwt_secret.get_secret_value() == self.rt_token_secret.get_secret_value():
            problems.append("jwt_secret and rt_token_secret must differ (TOK-02)")
        if self.database_url.startswith("sqlite"):
            problems.append("database_url must not be sqlite in prod")
        if not (self.apple_client_ids or self.google_client_ids):
            problems.append("at least one OIDC client id is required")
        if self.translator_provider == "mock":
            problems.append("translator_provider must not be mock in prod")
        if problems:
            raise RuntimeError("Unsafe production configuration: " + "; ".join(problems))


@lru_cache
def get_settings() -> Settings:
    return Settings()
