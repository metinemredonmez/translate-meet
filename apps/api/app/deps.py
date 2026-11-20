from collections.abc import Iterator

import jwt
from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app.config import Settings
from app.errors import ApiError
from app.models import User
from app.security import decode_access_token


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    db: Session = request.app.state.sessionmaker()
    try:
        yield db
    finally:
        db.close()


def current_user(
    request: Request, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)
) -> User:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise ApiError(401, "unauthorized", "missing bearer token")
    try:
        claims = decode_access_token(settings, token)
    except jwt.PyJWTError as exc:
        raise ApiError(401, "unauthorized", "invalid token") from exc
    # ARC-02: identity comes only from the verified token.
    user = db.get(User, claims["sub"])
    if user is None:
        raise ApiError(401, "unauthorized", "invalid token")
    return user
