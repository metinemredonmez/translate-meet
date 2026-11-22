import jwt
from conftest import auth, idem
from cryptography.fernet import Fernet

from app.security import REALTIME_AUDIENCE

BODY = {"text": "Merhaba dünya", "source_lang": "tr", "target_lang": "en"}


def _translate(client, tokens, body=BODY, key=None):
    return client.post(
        "/v1/translate/text", json=body, headers={**auth(tokens), "Idempotency-Key": key or idem()}
    )


def test_translate_text_and_quota(client, login):
    tokens = login()
    res = _translate(client, tokens)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["translated_text"] == "[tr->en] Merhaba dünya"
    assert data["provider"] == "mock"
    quota = client.get("/v1/quota", headers=auth(tokens)).json()
    assert quota["text_chars_remaining"] == 100 - len(BODY["text"])


def test_translate_requires_auth(client):
    res = client.post("/v1/translate/text", json=BODY, headers={"Idempotency-Key": idem()})
    assert res.status_code == 401


def test_translate_requires_idempotency_key(client, login):
    res = client.post("/v1/translate/text", json=BODY, headers=auth(login()))
    assert res.status_code == 422


def test_translate_validates_input_without_echo(client, login):
    secret_text = "x" * 5001
    res = _translate(client, login(), body={**BODY, "text": secret_text})
    assert res.status_code == 422
    assert secret_text not in res.text
    assert _translate(client, login(), body={**BODY, "target_lang": "EN; drop"}).status_code == 422


def test_same_key_same_payload_charged_once(client, login):
    tokens = login()
    key = idem()
    a = _translate(client, tokens, key=key).json()
    b = _translate(client, tokens, key=key).json()
    assert a["id"] == b["id"]
    quota = client.get("/v1/quota", headers=auth(tokens)).json()
    assert quota["text_chars_remaining"] == 100 - len(BODY["text"])


def test_same_key_different_payload_conflict(client, login):
    tokens = login()
    key = idem()
    assert _translate(client, tokens, key=key).status_code == 200
    res = _translate(client, tokens, body={**BODY, "text": "başka"}, key=key)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "idempotency_conflict"


def test_quota_exceeded(client, login):
    tokens = login()
    assert _translate(client, tokens, body={**BODY, "text": "a" * 90}).status_code == 200
    res = _translate(client, tokens, body={**BODY, "text": "b" * 20})
    assert res.status_code == 402
    assert res.json()["error"]["code"] == "quota_exceeded"


def test_provider_failure_releases_quota(failing_client, id_token):
    from conftest import NONCE

    tokens = failing_client.post(
        "/v1/auth/oauth", json={"provider": "google", "id_token": id_token(), "nonce": NONCE}
    ).json()
    res = _translate(failing_client, tokens)
    assert res.status_code == 502
    assert "provider down" not in res.text
    quota = failing_client.get("/v1/quota", headers=auth(tokens)).json()
    assert quota["text_chars_remaining"] == 100


def test_other_users_translation_is_404(client, login):
    alice = login("alice")
    bob = login("bob")
    tid = _translate(client, alice).json()["id"]
    assert client.get(f"/v1/translations/{tid}", headers=auth(alice)).status_code == 200
    res = client.get(f"/v1/translations/{tid}", headers=auth(bob))
    assert res.status_code == 404
    assert client.get("/v1/translations/does-not-exist", headers=auth(alice)).status_code == 404


def test_realtime_token(client, login, settings):
    res = client.post(
        "/v1/realtime/token", json={"source_lang": "tr", "target_lang": "en"}, headers=auth(login())
    )
    assert res.status_code == 200
    body = res.json()
    claims = jwt.decode(
        body["token"],
        settings.rt_token_secret.get_secret_value(),
        algorithms=["HS256"],
        audience=REALTIME_AUDIENCE,
    )
    assert claims["typ"] == "rt" and claims["src"] == "tr" and claims["tgt"] == "en"
    assert body["expires_in"] == 60


def _internal(settings):
    return {"X-Internal-Token": settings.internal_service_token.get_secret_value()}


def test_internal_quota_requires_service_token(client, login):
    user_id = client.get("/v1/me", headers=auth(login())).json()["id"]
    body = {"user_id": user_id, "amount": 10, "idempotency_key": "sess-1:0"}
    assert client.post("/internal/quota/reserve", json=body).status_code == 401
    assert (
        client.post("/internal/quota/reserve", json=body, headers={"X-Internal-Token": "nope"}).status_code
        == 401
    )


def test_internal_quota_flow_and_realtime_exhaustion(client, login, settings):
    tokens = login()
    user_id = client.get("/v1/me", headers=auth(tokens)).json()["id"]
    h = _internal(settings)
    r1 = client.post(
        "/internal/quota/reserve",
        json={"user_id": user_id, "amount": 20, "idempotency_key": "session-1:0"},
        headers=h,
    )
    assert r1.json()["granted"] == 20
    assert r1.json()["remaining_after"] == 10
    # idempotent retry returns the same reservation
    again = client.post(
        "/internal/quota/reserve",
        json={"user_id": user_id, "amount": 20, "idempotency_key": "session-1:0"},
        headers=h,
    )
    assert again.json()["reservation_id"] == r1.json()["reservation_id"]
    r2 = client.post(
        "/internal/quota/reserve",
        json={"user_id": user_id, "amount": 20, "idempotency_key": "session-1:1"},
        headers=h,
    )
    assert r2.json()["granted"] == 10  # partial grant up to the daily limit (30)
    rid2 = r2.json()["reservation_id"]
    r3 = client.post(
        "/internal/quota/reserve",
        json={"user_id": user_id, "amount": 5, "idempotency_key": "session-1:2"},
        headers=h,
    )
    assert r3.status_code == 402
    assert (
        client.post(
            "/v1/realtime/token", json={"source_lang": "tr", "target_lang": "en"}, headers=auth(tokens)
        ).status_code
        == 402
    )
    # release frees quota again
    assert (
        client.post(
            "/internal/quota/release", json={"user_id": user_id, "reservation_id": rid2}, headers=h
        ).status_code
        == 204
    )
    assert client.get("/v1/quota", headers=auth(tokens)).json()["realtime_seconds_remaining"] == 10
    commit = client.post(
        "/internal/quota/commit",
        json={"user_id": user_id, "reservation_id": r1.json()["reservation_id"], "amount": 7},
        headers=h,
    )
    assert commit.status_code == 204
    assert client.get("/v1/quota", headers=auth(tokens)).json()["realtime_seconds_remaining"] == 23


def test_internal_commit_other_users_reservation_is_404(client, login, settings):
    alice = client.get("/v1/me", headers=auth(login("alice"))).json()["id"]
    bob = client.get("/v1/me", headers=auth(login("bob"))).json()["id"]
    h = _internal(settings)
    rid = client.post(
        "/internal/quota/reserve",
        json={"user_id": alice, "amount": 5, "idempotency_key": "session-a:0"},
        headers=h,
    ).json()["reservation_id"]
    res = client.post(
        "/internal/quota/commit", json={"user_id": bob, "reservation_id": rid, "amount": 5}, headers=h
    )
    assert res.status_code == 404


def test_prod_settings_safe_example_passes():
    from app.config import Settings

    Settings(
        env="prod",
        database_url="postgresql+psycopg://u@db/x",
        jwt_secret="a" * 40,
        rt_token_secret="b" * 40,
        internal_service_token="c" * 40,
        google_client_ids=["x"],
        translator_provider="chain",
        data_encryption_key=Fernet.generate_key().decode(),
        admin_allowed_origins=["https://panel.translatemeet.app"],
    ).assert_safe()
    assert jwt  # keep import used


def test_internal_translate_for_gateway(client, settings):
    body = {"text": "Merhaba", "source_lang": "tr", "target_lang": "en"}
    assert client.post("/internal/translate", json=body).status_code == 401
    res = client.post("/internal/translate", json=body, headers=_internal(settings))
    assert res.status_code == 200
    assert res.json() == {"translated_text": "[tr->en] Merhaba", "provider": "mock"}
    bad = client.post("/internal/translate", json={**body, "text": ""}, headers=_internal(settings))
    assert bad.status_code == 422
