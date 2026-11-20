"""Apple / Google ID token verification (TOK-03). The server, not the client, decides who the user is."""

import hashlib
import hmac
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import jwt

ISSUERS: dict[str, set[str]] = {
    "apple": {"https://appleid.apple.com"},
    "google": {"https://accounts.google.com", "accounts.google.com"},
}
JWKS_URLS = {
    "apple": "https://appleid.apple.com/auth/keys",
    "google": "https://www.googleapis.com/oauth2/v3/certs",
}


class IdTokenError(Exception):
    pass


@dataclass(frozen=True)
class Identity:
    provider: str
    subject: str
    email: str | None


KeyResolver = Callable[[str, str | None], Any]


class OIDCVerifier:
    def __init__(self, audiences: dict[str, list[str]], key_resolver: KeyResolver | None = None) -> None:
        self._audiences = audiences
        self._resolver = key_resolver
        self._clients = (
            {} if key_resolver else {p: jwt.PyJWKClient(url, lifespan=3600) for p, url in JWKS_URLS.items()}
        )

    def _signing_key(self, provider: str, token: str) -> Any:
        if self._resolver is not None:
            return self._resolver(provider, jwt.get_unverified_header(token).get("kid"))
        return self._clients[provider].get_signing_key_from_jwt(token).key

    def verify(self, provider: str, id_token: str, nonce: str) -> Identity:
        if provider not in ISSUERS:
            raise IdTokenError("unknown_provider")
        audiences = self._audiences.get(provider) or []
        if not audiences:
            raise IdTokenError("provider_not_configured")
        try:
            claims = jwt.decode(
                id_token,
                self._signing_key(provider, id_token),
                algorithms=["RS256"],
                audience=audiences,
                options={"require": ["exp", "iat", "iss", "aud", "sub"]},
                leeway=30,
            )
        except jwt.PyJWTError as exc:
            raise IdTokenError("invalid_token") from exc
        if claims["iss"] not in ISSUERS[provider]:
            raise IdTokenError("invalid_issuer")
        claim_nonce = claims.get("nonce")
        hashed = hashlib.sha256(nonce.encode()).hexdigest()
        # Apple apps usually send sha256(raw nonce) to Apple and the raw nonce to us.
        if not isinstance(claim_nonce, str) or not (
            hmac.compare_digest(claim_nonce, nonce) or hmac.compare_digest(claim_nonce, hashed)
        ):
            raise IdTokenError("invalid_nonce")
        email_verified = claims.get("email_verified") in (True, "true")
        return Identity(
            provider=provider, subject=claims["sub"], email=claims.get("email") if email_verified else None
        )
