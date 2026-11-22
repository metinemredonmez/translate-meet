import importlib.util
import random
from pathlib import Path

import pytest
from sqlalchemy import func, select

from app.config import Settings
from app.models import Translation, User

_spec = importlib.util.spec_from_file_location(
    "seed_demo", Path(__file__).resolve().parents[1] / "scripts" / "seed_demo.py"
)
seed_demo = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(seed_demo)


def test_guard_refuses_prod_and_non_sqlite():
    with pytest.raises(SystemExit):
        seed_demo.guard(Settings(_env_file=None, env="prod"))
    with pytest.raises(SystemExit):
        seed_demo.guard(Settings(_env_file=None, env="dev", database_url="postgresql+psycopg://x@db/y"))
    seed_demo.guard(Settings(_env_file=None, env="dev"))


def test_seed_and_clear_only_touch_demo_users(app, client, login):
    login("real-user")
    db = app.state.sessionmaker()
    result = seed_demo.seed(db, users=6, rng=random.Random(1))  # noqa: S311
    db.commit()
    assert result["users"] == 6
    assert db.scalar(select(func.count(User.id)).where(User.provider == "demo")) == 6
    assert db.scalar(select(func.count(Translation.id))) == result["translations"]
    assert seed_demo.clear(db) == 6
    db.commit()
    assert db.scalar(select(func.count(User.id))) == 1  # the real user survives
    db.close()
