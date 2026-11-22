import datetime as dt
import uuid

import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import REALTIME_AUDIENCE, create_app
from app.quota_client import QuotaExhausted, QuotaUnavailable, Reservation


class FakeQuota:
    def __init__(self, budget: int = 30, down: bool = False) -> None:
        self.budget, self.down = budget, down
        self.reservations: dict[str, dict] = {}
        self.keys: dict[str, str] = {}

    def used(self) -> int:
        return sum(r["amount"] for r in self.reservations.values() if r["state"] != "released")

    async def reserve(self, user_id: str, amount: int, idempotency_key: str) -> Reservation:
        if self.down:
            raise QuotaUnavailable("down")
        available = self.budget - self.used()
        if available <= 0:
            raise QuotaExhausted()
        granted = min(amount, available)
        rid = str(uuid.uuid4())
        self.reservations[rid] = {"user": user_id, "amount": granted, "state": "reserved"}
        self.keys[idempotency_key] = rid
        return Reservation(rid, granted, self.budget - self.used())

    async def commit(self, user_id: str, reservation_id: str, amount: int) -> None:
        r = self.reservations[reservation_id]
        r["amount"], r["state"] = min(amount, r["amount"]), "committed"

    async def release(self, user_id: str, reservation_id: str) -> None:
        self.reservations[reservation_id]["state"] = "released"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        _env_file=None,  # tests never read a developer's local .env
        env="test",
        auth_timeout_seconds=0.5,
        quota_tick_seconds=10,
        tick_interval_override=0.1,
        allowed_origins=["https://app.translatemeet.test"],
        max_messages_per_second=20,
    )


@pytest.fixture
def quota() -> FakeQuota:
    return FakeQuota()


@pytest.fixture
def client(settings, quota):
    return TestClient(create_app(settings, quota_client=quota))


@pytest.fixture
def rt_token(settings):
    def make(src: str = "tr", tgt: str = "en", **overrides) -> str:
        now = dt.datetime.now(dt.UTC)
        claims = {
            "iss": settings.jwt_issuer,
            "aud": REALTIME_AUDIENCE,
            "sub": "user-1",
            "typ": "rt",
            "jti": str(uuid.uuid4()),
            "src": src,
            "tgt": tgt,
            "iat": now,
            "exp": now + dt.timedelta(seconds=60),
        }
        claims.update(overrides)
        secret = overrides.pop("_secret", None) or settings.rt_token_secret.get_secret_value()
        claims.pop("_secret", None)
        return jwt.encode(claims, secret, algorithm="HS256")

    return make
