import hashlib
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hash.hash("not-a-real-password")


class TokenError(ValueError):
    """Raised when a JWT is invalid or has the wrong purpose."""


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def verify_dummy_password(password: str) -> None:
    password_hash.verify(password, DUMMY_PASSWORD_HASH)


def _create_token(
    subject: uuid.UUID,
    token_type: Literal["access", "refresh"],
    expires_delta: timedelta,
    secret: str,
) -> tuple[str, str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + expires_delta
    jti = str(uuid.uuid4())
    payload = {
        "sub": str(subject),
        "type": token_type,
        "jti": jti,
        "iat": now,
        "nbf": now,
        "exp": expires_at,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }
    return (
        jwt.encode(payload, secret, algorithm=settings.jwt_algorithm),
        jti,
        expires_at,
    )


def create_access_token(user_id: uuid.UUID) -> str:
    token, _, _ = _create_token(
        user_id,
        "access",
        timedelta(minutes=settings.access_token_expire_minutes),
        settings.jwt_secret_key,
    )
    return token


def create_refresh_token(user_id: uuid.UUID) -> tuple[str, str, datetime]:
    return _create_token(
        user_id,
        "refresh",
        timedelta(days=settings.refresh_token_expire_days),
        settings.jwt_refresh_secret_key,
    )


def decode_token(token: str, expected_type: Literal["access", "refresh"]) -> dict[str, Any]:
    secret = (
        settings.jwt_secret_key if expected_type == "access" else settings.jwt_refresh_secret_key
    )
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["sub", "type", "jti", "iat", "nbf", "exp", "iss", "aud"]},
        )
        if payload.get("type") != expected_type:
            raise TokenError("Wrong token type")
        uuid.UUID(payload["sub"])
        uuid.UUID(payload["jti"])
        return payload
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError) as exc:
        raise TokenError("Invalid token") from exc


def token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
