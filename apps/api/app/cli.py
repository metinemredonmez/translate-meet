"""Operator CLI. Admin accounts are created here only — there is no self-signup.

uv run python -m app.cli create-admin --email ops@example.com [--role viewer]
uv run python -m app.cli reset-mfa --email ops@example.com
uv run python -m app.cli disable-admin --email ops@example.com
"""

import argparse
import getpass
import sys

from sqlalchemy import select

from app.admin_security import (
    PasswordPolicyError,
    audit,
    check_password_policy,
    encrypt_secret,
    hash_password,
    new_totp_secret,
    provisioning_uri,
)
from app.config import get_settings
from app.db import make_engine, make_sessionmaker
from app.models import Admin, AdminSession, utcnow


def _session():
    settings = get_settings()
    return settings, make_sessionmaker(make_engine(settings.database_url))()


def _print_mfa(secret: str, email: str) -> None:
    print("\nAuthenticator uygulamasına (Google Authenticator, 1Password, Authy…) ekle:")
    print(f"  {provisioning_uri(secret, email)}")
    print(f"  (elle giriş için gizli anahtar: {secret})")
    print("Bu bilgi bir daha gösterilmez; ekran görüntüsü alma, paylaşma.\n")


def create_admin(email: str, role: str) -> int:
    settings, db = _session()
    email = email.strip().lower()
    if db.scalar(select(Admin).where(Admin.email == email)):
        print("Bu e-posta ile admin zaten var.", file=sys.stderr)
        return 1
    password = getpass.getpass("Parola (15–128 karakter): ")
    if getpass.getpass("Parola tekrar: ") != password:
        print("Parolalar eşleşmiyor.", file=sys.stderr)
        return 1
    try:
        check_password_policy(password, email)
    except PasswordPolicyError as exc:
        print(f"Parola reddedildi: {exc}", file=sys.stderr)
        return 1
    secret = new_totp_secret()
    admin = Admin(
        email=email,
        password_hash=hash_password(password),
        totp_secret_enc=encrypt_secret(settings, secret),
        role=role,
    )
    db.add(admin)
    db.flush()
    audit(
        db,
        "admin.created",
        target_type="admin",
        target_id=admin.id,
        detail={"role": role},
        actor_type="system",
    )
    db.commit()
    print(f"Admin oluşturuldu: {email} ({role})")
    _print_mfa(secret, email)
    return 0


def reset_mfa(email: str) -> int:
    settings, db = _session()
    admin = db.scalar(select(Admin).where(Admin.email == email.strip().lower()))
    if admin is None:
        print("Admin bulunamadı.", file=sys.stderr)
        return 1
    secret = new_totp_secret()
    admin.totp_secret_enc = encrypt_secret(settings, secret)
    admin.last_totp_step = 0
    for s in db.scalars(
        select(AdminSession).where(AdminSession.admin_id == admin.id, AdminSession.revoked_at.is_(None))
    ):
        s.revoked_at = utcnow()  # AUT-04: MFA change ends existing sessions
    audit(db, "admin.mfa_reset", target_type="admin", target_id=admin.id, actor_type="system")
    db.commit()
    _print_mfa(secret, admin.email)
    return 0


def disable_admin(email: str) -> int:
    _, db = _session()
    admin = db.scalar(select(Admin).where(Admin.email == email.strip().lower()))
    if admin is None:
        print("Admin bulunamadı.", file=sys.stderr)
        return 1
    admin.disabled_at = utcnow()
    for s in db.scalars(
        select(AdminSession).where(AdminSession.admin_id == admin.id, AdminSession.revoked_at.is_(None))
    ):
        s.revoked_at = utcnow()
    audit(db, "admin.disabled", target_type="admin", target_id=admin.id, actor_type="system")
    db.commit()
    print("Admin devre dışı bırakıldı, oturumları kapatıldı.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="app.cli")
    sub = parser.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("create-admin")
    c.add_argument("--email", help="sorulmazsa etkileşimli istenir")
    c.add_argument("--role", choices=["admin", "viewer"], default="admin")
    sub.add_parser("reset-mfa").add_argument("--email", required=True)
    sub.add_parser("disable-admin").add_argument("--email", required=True)
    args = parser.parse_args()
    if args.cmd == "create-admin":
        email = args.email or input("Admin e-posta: ").strip()
        if "@" not in email:
            print("Geçerli bir e-posta gir.", file=sys.stderr)
            return 1
        return create_admin(email, args.role)
    if args.cmd == "reset-mfa":
        return reset_mfa(args.email)
    return disable_admin(args.email)


if __name__ == "__main__":
    raise SystemExit(main())
