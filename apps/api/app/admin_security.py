"""Admin credentials, MFA and sessions.

- Passwords: Argon2id, 15–128 chars, common-password deny list (PWD-01/03/04).
- MFA: TOTP is mandatory for every admin (AUT-01); a TOTP step can be used once (replay guard).
- Sessions: opaque random token in an httpOnly SameSite=Strict cookie, stored hashed server-side,
  absolute + idle expiry, revocable (SES-01/02/04). CSRF token bound to the session (WEB-03).
"""

import datetime as dt
import hashlib
import hmac
import json
import secrets
import time
import uuid

import jwt
import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import Admin, AdminSession, AuditLog, as_utc, utcnow

ADMIN_MFA_AUDIENCE = "translate-meet-admin-mfa"
SESSION_COOKIE = "tm_admin"
CSRF_COOKIE = "tm_csrf"
CSRF_HEADER = "x-csrf-token"

_hasher = PasswordHasher()  # argon2id defaults
_DUMMY_HASH = _hasher.hash("timing-equaliser-password-not-used")

_COMMON = {
    "passwordpassword",
    "123456789012345",
    "qwertyuiopasdfg",
    "admin123456789!",
    "translatemeet123",
    "iloveyou12345678",
    "aaaaaaaaaaaaaaa",
    "111111111111111",
    "parola123456789",
    "sifre1234567890",
}


class PasswordPolicyError(ValueError):
    pass


def check_password_policy(password: str, email: str = "") -> None:
    if not 15 <= len(password) <= 128:
        raise PasswordPolicyError("password must be 15-128 characters")
    lowered = password.lower()
    if lowered in _COMMON or len(set(password)) < 5:
        raise PasswordPolicyError("password is too common or repetitive")
    local = email.split("@")[0].lower()
    if local and len(local) >= 4 and local in lowered:
        raise PasswordPolicyError("password must not contain the e-mail name")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(stored_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(stored_hash or _DUMMY_HASH, password) and stored_hash is not None
    except (VerificationError, InvalidHashError):
        return False


# ---------------------------------------------------------------- TOTP


def _fernet(settings: Settings) -> Fernet:
    return Fernet(settings.data_encryption_key.get_secret_value().encode())


def new_totp_secret() -> str:
    return pyotp.random_base32()


def encrypt_secret(settings: Settings, secret: str) -> str:
    return _fernet(settings).encrypt(secret.encode()).decode()


def decrypt_secret(settings: Settings, token: str) -> str:
    try:
        return _fernet(settings).decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError("TOTP secret cannot be decrypted with the configured key") from exc


def provisioning_uri(secret: str, email: str) -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name="Translate Meet Admin")


def verify_totp(settings: Settings, admin: Admin, code: str, now: float | None = None) -> bool:
    """Accepts the current step ±1; each step only once (replay guard)."""
    if not code.isdigit() or len(code) != 6:
        return False
    totp = pyotp.TOTP(decrypt_secret(settings, admin.totp_secret_enc))
    now = time.time() if now is None else now
    current = int(now // totp.interval)
    for step in (current - 1, current, current + 1):
        if step <= admin.last_totp_step:
            continue
        if hmac.compare_digest(totp.at(step * totp.interval), code):
            admin.last_totp_step = step
            return True
    return False


# ---------------------------------------------------------------- MFA pending token


def issue_mfa_token(settings: Settings, admin_id: str) -> str:
    now = dt.datetime.now(dt.UTC)
    claims = {
        "iss": settings.jwt_issuer,
        "aud": ADMIN_MFA_AUDIENCE,
        "sub": admin_id,
        "typ": "admin_mfa",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + dt.timedelta(minutes=5),
    }
    return jwt.encode(claims, settings.jwt_secret.get_secret_value(), algorithm="HS256")


def decode_mfa_token(settings: Settings, token: str) -> str:
    claims = jwt.decode(
        token,
        settings.jwt_secret.get_secret_value(),
        algorithms=["HS256"],
        audience=ADMIN_MFA_AUDIENCE,
        issuer=settings.jwt_issuer,
        options={"require": ["exp", "iat", "sub", "aud", "iss"]},
    )
    if claims.get("typ") != "admin_mfa":
        raise jwt.InvalidTokenError("wrong token type")
    return claims["sub"]


# ---------------------------------------------------------------- sessions


def _digest(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def create_session(db: Session, settings: Settings, admin: Admin) -> tuple[str, str]:
    token, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    now = utcnow()
    db.add(
        AdminSession(
            admin_id=admin.id,
            token_hash=_digest(token),
            csrf_hash=_digest(csrf),
            created_at=now,
            last_seen_at=now,
            expires_at=now + dt.timedelta(hours=settings.admin_session_hours),
        )
    )
    return token, csrf


def find_session(db: Session, settings: Settings, token: str) -> AdminSession | None:
    from sqlalchemy import select

    session = db.scalar(select(AdminSession).where(AdminSession.token_hash == _digest(token)))
    if session is None or session.revoked_at is not None:
        return None
    now = utcnow()
    if as_utc(session.expires_at) <= now:
        return None
    if now - as_utc(session.last_seen_at) > dt.timedelta(minutes=settings.admin_idle_minutes):
        session.revoked_at = now
        return None
    return session


def csrf_matches(session: AdminSession, header_value: str | None, cookie_value: str | None) -> bool:
    if not header_value or not cookie_value or not hmac.compare_digest(header_value, cookie_value):
        return False
    return hmac.compare_digest(_digest(header_value), session.csrf_hash)


# ---------------------------------------------------------------- audit


def audit(
    db: Session,
    action: str,
    actor_id: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    detail: dict | None = None,
    ip: str | None = None,
    actor_type: str = "admin",
) -> None:
    db.add(
        AuditLog(
            actor_type=actor_type,
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=json.dumps(detail, separators=(",", ":"), ensure_ascii=False) if detail else None,
            ip=ip,
        )
    )
