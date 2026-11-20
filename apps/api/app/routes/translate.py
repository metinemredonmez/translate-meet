import datetime as dt
import hashlib
import json

from fastapi import APIRouter, Depends, Header, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import quota
from app.config import Settings
from app.deps import current_user, get_db, get_settings
from app.errors import ApiError
from app.models import Translation, User
from app.security import security_event

router = APIRouter(prefix="/v1")

LANG_PATTERN = r"^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$"
IDEM_PATTERN = r"^[A-Za-z0-9_-]{8,128}$"


class TranslateIn(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    source_lang: str = Field(pattern=LANG_PATTERN)
    target_lang: str = Field(pattern=LANG_PATTERN)


class TranslationOut(BaseModel):
    id: str
    source_lang: str
    target_lang: str
    source_text: str
    translated_text: str
    provider: str
    created_at: dt.datetime


class QuotaOut(BaseModel):
    text_chars_remaining: int
    realtime_seconds_remaining: int
    resets_at: dt.datetime


def _out(t: Translation) -> TranslationOut:
    return TranslationOut(
        id=t.id,
        source_lang=t.source_lang,
        target_lang=t.target_lang,
        source_text=t.source_text,
        translated_text=t.translated_text,
        provider=t.provider,
        created_at=t.created_at,
    )


def _request_hash(body: TranslateIn) -> str:
    payload = json.dumps([body.text, body.source_lang, body.target_lang], ensure_ascii=False)
    return hashlib.sha256(payload.encode()).hexdigest()


def _existing(db: Session, user_id: str, key: str) -> Translation | None:
    return db.scalar(
        select(Translation).where(Translation.user_id == user_id, Translation.idempotency_key == key)
    )


@router.get("/quota", response_model=QuotaOut)
def get_quota(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> QuotaOut:
    return QuotaOut(
        text_chars_remaining=quota.remaining(db, settings, user.id, "text_chars"),
        realtime_seconds_remaining=quota.remaining(db, settings, user.id, "realtime_seconds"),
        resets_at=quota.resets_at(),
    )


@router.post("/translate/text", response_model=TranslationOut)
def translate_text(
    body: TranslateIn,
    request: Request,
    idempotency_key: str = Header(alias="Idempotency-Key", pattern=IDEM_PATTERN),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TranslationOut:
    req_hash = _request_hash(body)
    found = _existing(db, user.id, idempotency_key)
    if found is not None:
        if found.request_hash != req_hash:
            raise ApiError(409, "idempotency_conflict", "key reused with different payload")
        return _out(found)

    try:
        entry = quota.reserve(db, settings, user.id, "text_chars", len(body.text), f"tr:{idempotency_key}")
    except quota.QuotaExceeded as exc:
        db.rollback()
        security_event("quota_exceeded", user_id=user.id, kind="text_chars")
        raise ApiError(402, "quota_exceeded", "daily text quota exceeded") from exc
    db.commit()

    translator = request.app.state.translator
    try:
        translated = translator.translate(body.text, body.source_lang, body.target_lang)
    except Exception as exc:
        quota.release(db, entry.id, user.id)
        db.commit()
        raise ApiError(502, "provider_error", "translation provider failed") from exc

    quota.commit(db, entry.id, user.id, len(body.text))
    record = Translation(
        user_id=user.id,
        idempotency_key=idempotency_key,
        request_hash=req_hash,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
        source_text=body.text,
        translated_text=translated,
        provider=translator.name,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:  # concurrent request with the same key won the race
        db.rollback()
        found = _existing(db, user.id, idempotency_key)
        if found is None or found.request_hash != req_hash:
            raise ApiError(409, "idempotency_conflict", "key reused with different payload") from None
        return _out(found)
    return _out(record)


@router.get("/translations/{translation_id}", response_model=TranslationOut)
def get_translation(
    translation_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)
) -> TranslationOut:
    # AZ-01: ownership is part of the query; foreign or missing => 404.
    record = db.scalar(
        select(Translation).where(Translation.id == translation_id, Translation.user_id == user.id)
    )
    if record is None:
        raise ApiError(404, "not_found", "not found")
    return _out(record)
