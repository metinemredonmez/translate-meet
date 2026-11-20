import datetime as dt

import jwt
import pytest
from conftest import NONCE, auth

from app.config import Settings
from app.security import issue_realtime_token


def test_healthz(client):
    assert client.get("/healthz").json() == {"status": "ok"}


def test_prod_refuses_insecure_defaults():
    with pytest.raises(RuntimeError, match="Unsafe production configuration"):
        Settings(env="prod").assert_safe()


def test_oauth_login_and_me(client, login):
    tokens = login()
    assert tokens["token_type"] == "bearer"
    me = client.get("/v1/me", headers=auth(tokens))
    assert me.status_code == 200
    assert me.json()["email"] == "google-user-1@example.com"


def test_same_subject_maps_to_same_user(client, login):
    a = client.get("/v1/me", headers=auth(login())).json()["id"]
    b = client.get("/v1/me", headers=auth(login())).json()["id"]
    assert a == b


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "someone-else"},
        {"iss": "https://evil.example.com"},
        {"exp": dt.datetime.now(dt.UTC) - dt.timedelta(minutes=5)},
        {"nonce": "different-nonce-123"},
        {"nonce": None},
    ],
)
def test_oauth_rejects_bad_tokens(client, id_token, overrides):
    res = client.post(
        "/v1/auth/oauth", json={"provider": "google", "id_token": id_token(**overrides), "nonce": NONCE}
    )
    assert res.status_code == 401
    assert res.json()["error"]["code"] == "unauthorized"


def test_oauth_rejects_token_signed_by_other_key(client):
    from cryptography.hazmat.primitives.asymmetric import rsa

    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    now = dt.datetime.now(dt.UTC)
    forged = jwt.encode(
        {
            "iss": "https://accounts.google.com",
            "aud": "test-google-client",
            "sub": "x",
            "iat": now,
            "exp": now + dt.timedelta(minutes=5),
            "nonce": NONCE,
        },
        other,
        algorithm="RS256",
    )
    res = client.post("/v1/auth/oauth", json={"provider": "google", "id_token": forged, "nonce": NONCE})
    assert res.status_code == 401


def test_me_requires_valid_access_token(client, settings):
    assert client.get("/v1/me").status_code == 401
    assert client.get("/v1/me", headers={"Authorization": "Bearer garbage"}).status_code == 401
    # TOK-02: a realtime token must not work as an access token.
    rt = issue_realtime_token(settings, "any-user", "tr", "en")
    assert client.get("/v1/me", headers={"Authorization": f"Bearer {rt}"}).status_code == 401


def test_expired_access_token_rejected(client, settings, login):
    tokens = login()
    claims = jwt.decode(tokens["access_token"], options={"verify_signature": False})
    claims["exp"] = int(dt.datetime.now(dt.UTC).timestamp()) - 10
    expired = jwt.encode(claims, settings.jwt_secret.get_secret_value(), algorithm="HS256")
    assert client.get("/v1/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401


def test_alg_none_rejected(client, login):
    tokens = login()
    claims = jwt.decode(tokens["access_token"], options={"verify_signature": False})
    unsigned = jwt.encode(claims, key="", algorithm="none")
    assert client.get("/v1/me", headers={"Authorization": f"Bearer {unsigned}"}).status_code == 401


def test_refresh_rotation(client, login):
    first = login()
    res = client.post("/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert res.status_code == 200
    second = res.json()
    assert second["refresh_token"] != first["refresh_token"]
    assert client.get("/v1/me", headers=auth(second)).status_code == 200


def test_refresh_replay_revokes_family(client, login):
    first = login()
    second = client.post("/v1/auth/refresh", json={"refresh_token": first["refresh_token"]}).json()
    replay = client.post("/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert replay.status_code == 401
    # SES-05: the legitimately rotated token is now dead too.
    after = client.post("/v1/auth/refresh", json={"refresh_token": second["refresh_token"]})
    assert after.status_code == 401


def test_logout_revokes_refresh(client, login):
    tokens = login()
    assert client.post("/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}).status_code == 204
    res = client.post("/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert res.status_code == 401


def test_unknown_refresh_token(client):
    res = client.post("/v1/auth/refresh", json={"refresh_token": "x" * 43})
    assert res.status_code == 401
