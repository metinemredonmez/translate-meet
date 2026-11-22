"""Fill a LOCAL development database with fake demo data so the admin panel has something to show.

    uv run python scripts/seed_demo.py            # add demo users, translations and usage (last 7 days)
    uv run python scripts/seed_demo.py --clear    # remove everything this script created

Safety: refuses to run when TM_ENV=prod or when the database is not SQLite. All demo users have
provider="demo" and an @example.test e-mail, so they are easy to recognise and to remove.
"""

import argparse
import datetime as dt
import random
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import delete, select  # noqa: E402

from app.admin_security import audit  # noqa: E402
from app.config import Settings, get_settings  # noqa: E402
from app.db import make_engine, make_sessionmaker  # noqa: E402
from app.models import QuotaEntry, Translation, User  # noqa: E402

DEMO_PROVIDER = "demo"

SENTENCES = [
    ("tr", "en", "Toplantıyı gelecek salıya alabilir miyiz?", "Could we move the meeting to next Tuesday?"),
    (
        "tr",
        "en",
        "Fiyat kilogram başına dört değil, üç buçuk dolar.",
        "The price is not four but three and a half dollars per kilo.",
    ),
    ("en", "tr", "We can deliver within two weeks.", "İki hafta içinde teslim edebiliriz."),
    ("tr", "ar", "Hastane randevum yarın saat onda.", "موعدي في المستشفى غداً الساعة العاشرة."),
    ("de", "tr", "Wo ist der nächste Bahnhof?", "En yakın tren istasyonu nerede?"),
    ("tr", "ru", "Sözleşmeyi e-postayla gönderiyorum.", "Я отправляю договор по электронной почте."),
]
PROVIDER_WEIGHTS = [("kaptan", 70), ("gemini", 15), ("claude", 10), ("openai", 5)]


def guard(settings: Settings) -> None:
    if settings.env == "prod" or not settings.database_url.startswith("sqlite"):
        raise SystemExit("seed_demo: only for a local SQLite development database (TM_ENV != prod).")


def clear(db) -> int:
    ids = list(db.scalars(select(User.id).where(User.provider == DEMO_PROVIDER)))
    if ids:
        db.execute(delete(Translation).where(Translation.user_id.in_(ids)))
        db.execute(delete(QuotaEntry).where(QuotaEntry.user_id.in_(ids)))
        db.execute(delete(User).where(User.id.in_(ids)))
    return len(ids)


def seed(db, users: int = 24, rng: random.Random | None = None) -> dict:
    rng = rng or random.Random(42)  # noqa: S311 - fake demo data, not security
    now = dt.datetime.now(dt.UTC)
    providers, weights = zip(*PROVIDER_WEIGHTS, strict=True)
    created = {"users": 0, "translations": 0, "realtime_seconds": 0}
    for i in range(users):
        joined = now - dt.timedelta(days=rng.randint(0, 20), hours=rng.randint(0, 23))
        user = User(
            provider=DEMO_PROVIDER,
            provider_subject=f"demo-{uuid.uuid4().hex[:12]}",
            email=f"demo-{i + 1:02d}@example.test",
            locale=rng.choice(["tr", "tr", "en"]),
            created_at=joined,
            disabled_at=now - dt.timedelta(days=1) if i in (3, 11) else None,
        )
        db.add(user)
        db.flush()
        created["users"] += 1
        for day_offset in range(7):
            day = (now - dt.timedelta(days=day_offset)).date()
            if dt.datetime.combine(day, dt.time.max, tzinfo=dt.UTC) < joined:
                continue
            chars = 0
            for _ in range(rng.randint(0, 5)):
                src, tgt, text, out = rng.choice(SENTENCES)
                at = dt.datetime.combine(day, dt.time(rng.randint(8, 21), rng.randint(0, 59)), tzinfo=dt.UTC)
                if at > now:
                    at = now - dt.timedelta(minutes=rng.randint(1, 60))
                db.add(
                    Translation(
                        user_id=user.id,
                        idempotency_key=f"demo-{uuid.uuid4().hex}",
                        request_hash=uuid.uuid4().hex,
                        source_lang=src,
                        target_lang=tgt,
                        source_text=text,
                        translated_text=out,
                        provider=rng.choices(providers, weights)[0],
                        created_at=at,
                    )
                )
                chars += len(text)
                created["translations"] += 1
            if chars:
                db.add(
                    QuotaEntry(
                        user_id=user.id,
                        kind="text_chars",
                        day=day.isoformat(),
                        amount=chars,
                        state="committed",
                    )
                )
            seconds = rng.choice([0, 0, 30, 60, 90, 180, 300])
            if seconds:
                db.add(
                    QuotaEntry(
                        user_id=user.id,
                        kind="realtime_seconds",
                        day=day.isoformat(),
                        amount=seconds,
                        state="committed",
                    )
                )
                created["realtime_seconds"] += seconds
    return created


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--clear", action="store_true", help="only remove previously seeded demo data")
    parser.add_argument("--users", type=int, default=24)
    args = parser.parse_args()
    settings = get_settings()
    guard(settings)
    db = make_sessionmaker(make_engine(settings.database_url))()
    removed = clear(db)
    if args.clear:
        audit(db, "demo.cleared", detail={"users": removed}, actor_type="system")
        db.commit()
        print(f"Demo verisi silindi: {removed} kullanıcı.")
        return 0
    result = seed(db, users=args.users)
    audit(db, "demo.seeded", detail=result, actor_type="system")
    db.commit()
    print(
        f"Demo verisi yüklendi: {result['users']} kullanıcı, {result['translations']} çeviri, "
        f"{result['realtime_seconds']} sn canlı konuşma (son 7 gün). Silmek için: --clear"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
