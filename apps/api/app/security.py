import datetime as dt
import hashlib
import json
import logging
import secrets
import uuid

import jwt

from app.config import Settings

ACCESS_AUDIENCE = "translate-meet-api"
REALTIME_AUDIENCE = "translate-meet-gateway"

_security_log = logging.getLogger("security")


def security_event(event: str, **fields: str | int | None) -> None:
    """LOG-01/LOG-02: structured event; callers pass ids only, never tokens, text or audio."""
    _security_log.info(json.dumps({"event": event, **fields}, separators=(",", ":")))


def _now() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def issue_access_token(settings: Settings, user_id: str) -> str:
    now = _now()
    claims = {
        "iss": settings.jwt_issuer,
        "aud": ACCESS_AUDIENCE,
        "sub": user_id,
        "typ": "access",
        "jti": str(uuid.uuid4()),
        "iat": now,
        "exp": now + dt.timedelta(seconds=settings.access_ttl_seconds),
    }
    return jwt.encode(claims, settings.jwt_secret.get_secret_value(), algorithm="HS256")


def decode_access_token(settings: Settings, token: str) -> dict:
    # TOK-01: algorithm pinned, aud/iss/exp required. TOK-02: typ must be "access".
    claims = jwt.decode(
        token,
        settings.jwt_secret.get_secret_value(),
        algorithms=["HS256"],
        audience=ACCESS_AUDIENCE,
        issuer=settings.jwt_issuer,
        options={"require": ["exp", "iat", "sub", "aud", "iss", "jti"]},
    )
    if claims.get("typ") != "access":
        raise jwt.InvalidTokenError("wrong token type")
    return claims


def issue_realtime_token(settings: Settings, user_id: str, source_lang: str, target_lang: str) -> str:
    # TOK-02: separate key + audience so a realtime token can never be used as an API access token.
    now = _now()
    claims = {
        "iss": settings.jwt_issuer,
        "aud": REALTIME_AUDIENCE,
        "sub": user_id,
        "typ": "rt",
        "jti": str(uuid.uuid4()),
        "src": source_lang,
        "tgt": target_lang,
        "iat": now,
        "exp": now + dt.timedelta(seconds=settings.rt_token_ttl_seconds),
    }
    return jwt.encode(claims, settings.rt_token_secret.get_secret_value(), algorithm="HS256")


def new_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
