import datetime as dt
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import Base
from app.main import create_app
from app.oidc import OIDCVerifier

GOOGLE_AUD = "test-google-client"
NONCE = "nonce-1234567890"


@pytest.fixture(scope="session")
def rsa_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        _env_file=None,  # tests never read a developer's local .env
        env="test",
        database_url=f"sqlite:///{tmp_path}/test.db",
        google_client_ids=[GOOGLE_AUD],
        apple_client_ids=["app.translatemeet.mobile"],
        daily_text_chars=100,
        daily_realtime_seconds=30,
    )


class FailingTranslator:
    name = "failing"

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        raise RuntimeError("provider down")


def _make_app(settings, rsa_key, translator=None):
    verifier = OIDCVerifier(
        {"google": settings.google_client_ids, "apple": settings.apple_client_ids},
        key_resolver=lambda provider, kid: rsa_key.public_key(),  # fake JWKS
    )
    app = create_app(settings, verifier=verifier, translator=translator)
    Base.metadata.create_all(app.state.engine)
    return app


@pytest.fixture
def app(settings, rsa_key):
    return _make_app(settings, rsa_key)


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture
def failing_client(settings, rsa_key):
    return TestClient(_make_app(settings, rsa_key, translator=FailingTranslator()))


@pytest.fixture
def id_token(rsa_key):
    def make(sub: str = "google-user-1", **overrides) -> str:
        now = dt.datetime.now(dt.UTC)
        claims = {
            "iss": "https://accounts.google.com",
            "aud": GOOGLE_AUD,
            "sub": sub,
            "iat": now,
            "exp": now + dt.timedelta(minutes=5),
            "nonce": NONCE,
            "email": f"{sub}@example.com",
            "email_verified": True,
        }
        claims.update(overrides)
        claims = {k: v for k, v in claims.items() if v is not None}
        return jwt.encode(claims, rsa_key, algorithm="RS256", headers={"kid": "test"})

    return make


@pytest.fixture
def login(client, id_token):
    def do(sub: str = "google-user-1") -> dict:
        res = client.post(
            "/v1/auth/oauth", json={"provider": "google", "id_token": id_token(sub), "nonce": NONCE}
        )
        assert res.status_code == 200, res.text
        return res.json()

    return do


def auth(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def idem() -> str:
    return uuid.uuid4().hex
