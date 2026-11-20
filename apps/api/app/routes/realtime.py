import hmac
from typing import Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import quota
from app.config import Settings
from app.deps import current_user, get_db, get_settings
from app.errors import ApiError
from app.models import User
from app.routes.translate import LANG_PATTERN
from app.security import issue_realtime_token, security_event

router = APIRouter()


class RealtimeTokenIn(BaseModel):
    source_lang: str = Field(pattern=LANG_PATTERN)
    target_lang: str = Field(pattern=LANG_PATTERN)


class RealtimeTokenOut(BaseModel):
    token: str
    expires_in: int
    gateway_url: str


@router.post("/v1/realtime/token", response_model=RealtimeTokenOut)
def realtime_token(
    body: RealtimeTokenIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> RealtimeTokenOut:
    if quota.remaining(db, settings, user.id, "realtime_seconds") <= 0:
        security_event("quota_exceeded", user_id=user.id, kind="realtime_seconds")
        raise ApiError(402, "quota_exceeded", "daily realtime quota exceeded")
    return RealtimeTokenOut(
        token=issue_realtime_token(settings, user.id, body.source_lang, body.target_lang),
        expires_in=settings.rt_token_ttl_seconds,
        gateway_url=settings.gateway_public_url,
    )


# --- Internal: gateway -> api. Must not be routed publicly by nginx (NET-04); also token-protected (ARC-04).


def require_internal(request: Request, settings: Settings = Depends(get_settings)) -> None:
    supplied = request.headers.get("x-internal-token", "")
    expected = settings.internal_service_token.get_secret_value()
    if not hmac.compare_digest(supplied.encode(), expected.encode()):
        raise ApiError(401, "unauthorized", "invalid service token")


class ReserveIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    kind: Literal["realtime_seconds"] = "realtime_seconds"
    amount: int = Field(gt=0, le=600)
    idempotency_key: str = Field(min_length=8, max_length=160)


class ReserveOut(BaseModel):
    reservation_id: str
    granted: int
    remaining_after: int


class SettleIn(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    reservation_id: str = Field(min_length=1, max_length=64)
    amount: int = Field(default=0, ge=0, le=600)


@router.post("/internal/quota/reserve", response_model=ReserveOut, dependencies=[Depends(require_internal)])
def internal_reserve(
    body: ReserveIn, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)
) -> ReserveOut:
    if db.get(User, body.user_id) is None:
        raise ApiError(404, "not_found", "not found")
    try:
        entry = quota.reserve(
            db, settings, body.user_id, body.kind, body.amount, body.idempotency_key, partial=True
        )
    except quota.QuotaExceeded as exc:
        db.rollback()
        raise ApiError(402, "quota_exceeded", "quota exceeded") from exc
    db.commit()
    return ReserveOut(
        reservation_id=entry.id,
        granted=entry.amount,
        remaining_after=quota.remaining(db, settings, body.user_id, body.kind),
    )


@router.post("/internal/quota/commit", status_code=204, dependencies=[Depends(require_internal)])
def internal_commit(body: SettleIn, db: Session = Depends(get_db)) -> None:
    try:
        quota.commit(db, body.reservation_id, body.user_id, body.amount)
    except quota.QuotaEntryNotFound as exc:
        raise ApiError(404, "not_found", "not found") from exc
    db.commit()


@router.post("/internal/quota/release", status_code=204, dependencies=[Depends(require_internal)])
def internal_release(body: SettleIn, db: Session = Depends(get_db)) -> None:
    try:
        quota.release(db, body.reservation_id, body.user_id)
    except quota.QuotaEntryNotFound as exc:
        raise ApiError(404, "not_found", "not found") from exc
    db.commit()
