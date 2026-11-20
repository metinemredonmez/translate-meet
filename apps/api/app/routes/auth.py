import datetime as dt
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import Settings
from app.deps import current_user, get_db, get_settings
from app.errors import ApiError
from app.models import RefreshToken, User, as_utc, utcnow
from app.oidc import IdTokenError, OIDCVerifier
from app.security import hash_token, issue_access_token, new_refresh_token, security_event

router = APIRouter(prefix="/v1")


class OAuthIn(BaseModel):
    provider: Literal["apple", "google"]
    id_token: str = Field(min_length=20, max_length=8192)
    nonce: str = Field(min_length=8, max_length=256)


class RefreshIn(BaseModel):
    refresh_token: str = Field(min_length=20, max_length=256)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"  # noqa: S105
    expires_in: int


class MeOut(BaseModel):
    id: str
    email: str | None
    locale: str


def _issue_pair(db: Session, settings: Settings, user_id: str, family_id: str | None = None) -> TokenPair:
    raw, digest = new_refresh_token()
    db.add(
        RefreshToken(
            user_id=user_id,
            family_id=family_id or str(uuid.uuid4()),
            token_hash=digest,
            expires_at=utcnow() + dt.timedelta(seconds=settings.refresh_ttl_seconds),
        )
    )
    return TokenPair(
        access_token=issue_access_token(settings, user_id),
        refresh_token=raw,
        expires_in=settings.access_ttl_seconds,
    )


def _revoke_family(db: Session, family_id: str) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


@router.post("/auth/oauth", response_model=TokenPair)
def oauth_login(
    body: OAuthIn, request: Request, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)
) -> TokenPair:
    verifier: OIDCVerifier = request.app.state.verifier
    try:
        identity = verifier.verify(body.provider, body.id_token, body.nonce)
    except IdTokenError as exc:
        security_event("login_failure", provider=body.provider, reason=str(exc))
        raise ApiError(401, "unauthorized", "invalid identity token") from exc

    # Accounts are keyed by (provider, subject) only; we never auto-link by e-mail.
    user = db.scalar(
        select(User).where(User.provider == identity.provider, User.provider_subject == identity.subject)
    )
    if user is None:
        user = User(provider=identity.provider, provider_subject=identity.subject, email=identity.email)
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            user = db.scalar(
                select(User).where(
                    User.provider == identity.provider, User.provider_subject == identity.subject
                )
            )
            assert user is not None
    pair = _issue_pair(db, settings, user.id)
    db.commit()
    security_event("login_success", user_id=user.id, provider=identity.provider)
    return pair


@router.post("/auth/refresh", response_model=TokenPair)
def refresh(
    body: RefreshIn, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)
) -> TokenPair:
    token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(body.refresh_token)))
    if token is None:
        raise ApiError(401, "unauthorized", "invalid refresh token")
    if token.used_at is not None or token.revoked_at is not None:
        # SES-05: reuse of a rotated token => whole family is revoked.
        _revoke_family(db, token.family_id)
        db.commit()
        security_event("refresh_replay", user_id=token.user_id, family_id=token.family_id)
        raise ApiError(401, "unauthorized", "invalid refresh token")
    if as_utc(token.expires_at) <= utcnow():
        raise ApiError(401, "unauthorized", "refresh token expired")
    token.used_at = utcnow()
    pair = _issue_pair(db, settings, token.user_id, family_id=token.family_id)
    db.commit()
    return pair


@router.post("/auth/logout", status_code=204)
def logout(body: RefreshIn, db: Session = Depends(get_db)) -> Response:
    token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(body.refresh_token)))
    if token is not None:
        _revoke_family(db, token.family_id)  # SES-04
        db.commit()
        security_event("logout", user_id=token.user_id)
    return Response(status_code=204)


@router.get("/me", response_model=MeOut)
def me(user: User = Depends(current_user)) -> MeOut:
    return MeOut(id=user.id, email=user.email, locale=user.locale)
