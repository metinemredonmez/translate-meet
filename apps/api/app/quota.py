"""Quota ledger: reserve -> commit (actual usage) -> release (RES-01, BUS-02)."""

import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import QuotaEntry, User

KINDS = ("text_chars", "realtime_seconds")


class QuotaExceeded(Exception):
    pass


class QuotaEntryNotFound(Exception):
    pass


def today() -> str:
    return dt.datetime.now(dt.UTC).date().isoformat()


def resets_at() -> dt.datetime:
    tomorrow = dt.datetime.now(dt.UTC).date() + dt.timedelta(days=1)
    return dt.datetime.combine(tomorrow, dt.time.min, tzinfo=dt.UTC)


def limit_for(settings: Settings, kind: str) -> int:
    if kind == "text_chars":
        return settings.daily_text_chars
    if kind == "realtime_seconds":
        return settings.daily_realtime_seconds
    raise ValueError(kind)


def used(db: Session, user_id: str, kind: str) -> int:
    total = db.scalar(
        select(func.coalesce(func.sum(QuotaEntry.amount), 0)).where(
            QuotaEntry.user_id == user_id,
            QuotaEntry.kind == kind,
            QuotaEntry.day == today(),
            QuotaEntry.state.in_(("reserved", "committed")),
        )
    )
    return int(total or 0)


def remaining(db: Session, settings: Settings, user_id: str, kind: str) -> int:
    return max(0, limit_for(settings, kind) - used(db, user_id, kind))


def reserve(
    db: Session,
    settings: Settings,
    user_id: str,
    kind: str,
    amount: int,
    idempotency_key: str | None = None,
    partial: bool = False,
) -> QuotaEntry:
    if amount <= 0:
        raise ValueError("amount must be positive")
    # BUS-02: serialize reservations per user (row lock on Postgres; SQLite is single-writer anyway).
    db.execute(select(User.id).where(User.id == user_id).with_for_update()).one()
    existing = None
    if idempotency_key:
        existing = db.scalar(
            select(QuotaEntry).where(
                QuotaEntry.user_id == user_id,
                QuotaEntry.kind == kind,
                QuotaEntry.idempotency_key == idempotency_key,
            )
        )
        if existing is not None and existing.state != "released":
            return existing
    available = remaining(db, settings, user_id, kind)
    if available <= 0 or (not partial and available < amount):
        raise QuotaExceeded(kind)
    granted = min(amount, available)
    if existing is not None:  # retry after a released attempt
        existing.state, existing.amount, existing.day = "reserved", granted, today()
        db.flush()
        return existing
    entry = QuotaEntry(
        user_id=user_id,
        kind=kind,
        day=today(),
        amount=granted,
        state="reserved",
        idempotency_key=idempotency_key,
    )
    db.add(entry)
    db.flush()
    return entry


def _get_reserved(db: Session, entry_id: str, user_id: str) -> QuotaEntry:
    entry = db.get(QuotaEntry, entry_id)
    if entry is None or entry.user_id != user_id:
        raise QuotaEntryNotFound(entry_id)
    return entry


def commit(db: Session, entry_id: str, user_id: str, actual: int) -> QuotaEntry:
    entry = _get_reserved(db, entry_id, user_id)
    if entry.state == "reserved":
        entry.amount = max(0, min(actual, entry.amount))
        entry.state = "committed"
        db.flush()
    return entry


def release(db: Session, entry_id: str, user_id: str) -> QuotaEntry:
    entry = _get_reserved(db, entry_id, user_id)
    if entry.state == "reserved":
        entry.state = "released"
        db.flush()
    return entry
