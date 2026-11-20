"""initial schema: users, refresh tokens, quota ledger, translations

Revision ID: 0001
Revises:
"""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("provider", sa.String(16), nullable=False),
        sa.Column("provider_subject", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320)),
        sa.Column("locale", sa.String(16), nullable=False),
        sa.Column("created_at", TS, nullable=False),
        sa.UniqueConstraint("provider", "provider_subject", name="uq_users_provider_subject"),
    )
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("family_id", sa.String(36), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", TS, nullable=False),
        sa.Column("used_at", TS),
        sa.Column("revoked_at", TS),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"])
    op.create_table(
        "quota_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("day", sa.String(10), nullable=False),
        sa.Column("amount", sa.Integer, nullable=False),
        sa.Column("state", sa.String(16), nullable=False),
        sa.Column("idempotency_key", sa.String(160)),
        sa.Column("created_at", TS, nullable=False),
        sa.UniqueConstraint("user_id", "kind", "idempotency_key", name="uq_quota_idem"),
    )
    op.create_index("ix_quota_user_kind_day", "quota_entries", ["user_id", "kind", "day"])
    op.create_table(
        "translations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("idempotency_key", sa.String(128), nullable=False),
        sa.Column("request_hash", sa.String(64), nullable=False),
        sa.Column("source_lang", sa.String(16), nullable=False),
        sa.Column("target_lang", sa.String(16), nullable=False),
        sa.Column("source_text", sa.Text, nullable=False),
        sa.Column("translated_text", sa.Text, nullable=False),
        sa.Column("provider", sa.String(32), nullable=False),
        sa.Column("created_at", TS, nullable=False),
        sa.UniqueConstraint("user_id", "idempotency_key", name="uq_translation_idem"),
    )
    op.create_index("ix_translations_user_id", "translations", ["user_id"])


def downgrade() -> None:
    op.drop_table("translations")
    op.drop_table("quota_entries")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
