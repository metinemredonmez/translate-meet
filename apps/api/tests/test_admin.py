import datetime as dt
import secrets

import pyotp
import pytest
from conftest import auth
from fastapi.testclient import TestClient

from app.admin_security import (
    CSRF_COOKIE,
    PasswordPolicyError,
    check_password_policy,
    encrypt_secret,
    hash_password,
    new_totp_secret,
)
from app.models import Admin, AdminSession, AuditLog

# Generated per run: no secret-looking literals in the repo (gitleaks).
PASSWORD = "tm-" + secrets.token_urlsafe(18)
ORIGIN = "http://localhost:3001"


@pytest.fixture
def make_admin(app, settings):
    def make(email="ops@example.com", role="admin"):
        secret = new_totp_secret()
        db = app.state.sessionmaker()
        db.add(
            Admin(
                email=email,
                password_hash=hash_password(PASSWORD),
                totp_secret_enc=encrypt_secret(settings, secret),
                role=role,
            )
        )
        db.commit()
        db.close()
        return pyotp.TOTP(secret)

    return make


def _login(client: TestClient, totp, email="ops@example.com"):
    step1 = client.post(
        "/v1/admin/auth/login", json={"email": email, "password": PASSWORD}, headers={"origin": ORIGIN}
    )
    assert step1.status_code == 200, step1.text
    step2 = client.post(
        "/v1/admin/auth/mfa",
        json={"mfa_token": step1.json()["mfa_token"], "code": totp.now()},
        headers={"origin": ORIGIN},
    )
    assert step2.status_code == 200, step2.text
    return step2


def _csrf(client: TestClient) -> dict:
    return {"x-csrf-token": client.cookies.get(CSRF_COOKIE), "origin": ORIGIN}


def test_password_policy():
    for bad in ("short", "a" * 20, "passwordpassword", "ops-ops-ops-ops-ops"):
        with pytest.raises(PasswordPolicyError):
            check_password_policy(bad, "ops@example.com")
    check_password_policy(PASSWORD, "ops@example.com")


def test_login_requires_password_and_totp_and_sets_strict_httponly_cookie(client, make_admin):
    totp = make_admin()
    res = _login(client, totp)
    assert res.json()["email"] == "ops@example.com"
    cookies = res.headers.get_list("set-cookie")
    session_cookie = next(c for c in cookies if c.startswith("tm_admin="))
    assert "HttpOnly" in session_cookie and "SameSite=strict" in session_cookie
    assert client.get("/v1/admin/me").json()["role"] == "admin"


def test_wrong_password_is_generic_and_locks_after_limit(client, make_admin, app):
    make_admin()
    for _ in range(5):
        r = client.post(
            "/v1/admin/auth/login", json={"email": "ops@example.com", "password": "wrong-password-123"}
        )
        assert r.status_code == 401 and r.json()["error"]["message"] == "invalid credentials"
    # locked now: even the right password gets the same generic answer
    r = client.post("/v1/admin/auth/login", json={"email": "ops@example.com", "password": PASSWORD})
    assert r.status_code == 401
    unknown = client.post("/v1/admin/auth/login", json={"email": "nobody@example.com", "password": PASSWORD})
    assert unknown.json() == r.json()  # no account enumeration


def test_totp_wrong_and_replayed_codes_rejected(client, make_admin):
    totp = make_admin()
    t1 = client.post("/v1/admin/auth/login", json={"email": "ops@example.com", "password": PASSWORD}).json()[
        "mfa_token"
    ]
    assert client.post("/v1/admin/auth/mfa", json={"mfa_token": t1, "code": "000000"}).status_code == 401
    code = totp.now()
    assert client.post("/v1/admin/auth/mfa", json={"mfa_token": t1, "code": code}).status_code == 200
    t2 = client.post("/v1/admin/auth/login", json={"email": "ops@example.com", "password": PASSWORD}).json()[
        "mfa_token"
    ]
    assert (
        client.post("/v1/admin/auth/mfa", json={"mfa_token": t2, "code": code}).status_code == 401
    )  # replay


def test_mfa_token_cannot_be_used_as_session_or_app_token(client, make_admin):
    make_admin()
    t = client.post("/v1/admin/auth/login", json={"email": "ops@example.com", "password": PASSWORD}).json()[
        "mfa_token"
    ]
    assert client.get("/v1/me", headers={"Authorization": f"Bearer {t}"}).status_code == 401
    assert client.get("/v1/admin/me", headers={"Authorization": f"Bearer {t}"}).status_code == 401


def test_app_user_cannot_reach_admin(client, login):
    tokens = login()
    assert client.get("/v1/admin/stats", headers=auth(tokens)).status_code == 401


def test_csrf_and_origin_required_for_state_changes(client, make_admin, login):
    totp = make_admin()
    user_id = client.get("/v1/me", headers=auth(login("victim"))).json()["id"]
    _login(client, totp)
    no_csrf = client.post(f"/v1/admin/users/{user_id}/disable", json={"reason": "spam test"})
    assert no_csrf.status_code == 403
    wrong_origin = client.post(
        f"/v1/admin/users/{user_id}/disable",
        json={"reason": "spam test"},
        headers={**_csrf(client), "origin": "https://evil.example"},
    )
    assert wrong_origin.status_code == 403
    ok = client.post(
        f"/v1/admin/users/{user_id}/disable", json={"reason": "spam test"}, headers=_csrf(client)
    )
    assert ok.status_code == 200 and ok.json()["disabled"] is True


def test_disable_user_kills_sessions_and_blocks_login(client, make_admin, login, id_token):
    from conftest import NONCE

    totp = make_admin()
    tokens = login("victim")
    user_id = client.get("/v1/me", headers=auth(tokens)).json()["id"]
    _login(client, totp)
    client.post(f"/v1/admin/users/{user_id}/disable", json={"reason": "abuse"}, headers=_csrf(client))
    assert client.get("/v1/me", headers=auth(tokens)).status_code == 403
    assert client.post("/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}).status_code in (
        401,
        403,
    )
    relogin = client.post(
        "/v1/auth/oauth", json={"provider": "google", "id_token": id_token("victim"), "nonce": NONCE}
    )
    assert relogin.status_code == 403
    client.post(f"/v1/admin/users/{user_id}/enable", headers=_csrf(client))
    assert (
        client.post(
            "/v1/auth/oauth", json={"provider": "google", "id_token": id_token("victim"), "nonce": NONCE}
        ).status_code
        == 200
    )


def test_viewer_can_read_but_not_change(client, make_admin, login):
    totp = make_admin("viewer@example.com", role="viewer")
    user_id = client.get("/v1/me", headers=auth(login("u1"))).json()["id"]
    _login(client, totp, "viewer@example.com")
    assert client.get("/v1/admin/users").status_code == 200
    r = client.post(f"/v1/admin/users/{user_id}/disable", json={"reason": "nope"}, headers=_csrf(client))
    assert r.status_code == 403


def test_stats_users_and_no_translation_text(client, make_admin, login):
    totp = make_admin()
    tokens = login("alice")
    client.post(
        "/v1/translate/text",
        json={"text": "gizli kişisel cümle", "source_lang": "tr", "target_lang": "en"},
        headers={**auth(tokens), "Idempotency-Key": "k" * 12},
    )
    _login(client, totp)
    stats = client.get("/v1/admin/stats").json()
    assert stats["users_total"] == 1 and stats["translations_today"] == 1
    assert stats["by_provider_7d"] == {"mock": 1} and len(stats["daily_7d"]) == 7
    users = client.get("/v1/admin/users?q=alice").json()
    assert users["total"] == 1 and users["items"][0]["translations_total"] == 1
    detail = client.get(f"/v1/admin/users/{users['items'][0]['id']}")
    assert (
        "gizli kişisel cümle" not in detail.text
        and "gizli kişisel cümle" not in client.get("/v1/admin/users").text
    )
    assert client.get("/v1/admin/users/does-not-exist").status_code == 404
    # LIKE wildcards are escaped
    assert client.get("/v1/admin/users?q=%25").json()["total"] == 0


def test_providers_never_expose_keys(client, make_admin, settings):
    totp = make_admin()
    _login(client, totp)
    body = client.get("/v1/admin/providers").json()
    assert body["translator_provider"] == "mock"
    assert {row["name"] for row in body["chain"]} == {"kaptan", "gemini", "openai", "claude", "kimi"}
    assert all(set(row) == {"name", "configured", "model"} for row in body["chain"])


def test_logout_and_idle_expiry(client, make_admin, app, settings):
    totp = make_admin()
    _login(client, totp)
    assert client.post("/v1/admin/auth/logout", headers=_csrf(client)).status_code == 204
    assert client.get("/v1/admin/me").status_code == 401

    # idle expiry: age the session
    totp2 = make_admin("idle@example.com")
    _login(client, totp2, "idle@example.com")
    db = app.state.sessionmaker()
    for s in db.query(AdminSession).all():
        s.last_seen_at = dt.datetime.now(dt.UTC) - dt.timedelta(minutes=settings.admin_idle_minutes + 1)
    db.commit()
    db.close()
    assert client.get("/v1/admin/me").status_code == 401


def test_audit_log_records_admin_actions(client, make_admin, login, app):
    totp = make_admin()
    user_id = client.get("/v1/me", headers=auth(login("bob"))).json()["id"]
    client.post("/v1/admin/auth/login", json={"email": "ops@example.com", "password": "wrong-password-123"})
    _login(client, totp)
    client.post(f"/v1/admin/users/{user_id}/disable", json={"reason": "test reason"}, headers=_csrf(client))
    actions = [row["action"] for row in client.get("/v1/admin/audit").json()["items"]]
    assert {"admin.login_failed", "admin.login", "user.disable"} <= set(actions)
    db = app.state.sessionmaker()
    assert all(
        "password" not in (log.detail or "").lower() or "reason" in (log.detail or "")
        for log in db.query(AuditLog)
    )
    db.close()
