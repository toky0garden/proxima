import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    token_fingerprint,
    verify_dummy_password,
    verify_password,
)
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair
from app.schemas.user import UserResponse

router = APIRouter()


def _as_utc(value: datetime) -> datetime:
    """SQLite drops timezone info; PostgreSQL keeps it."""
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _new_session(user_id: uuid.UUID) -> tuple[str, RefreshSession]:
    token, jti, expires_at = create_refresh_token(user_id)
    session = RefreshSession(
        user_id=user_id,
        jti=jti,
        token_hash=token_fingerprint(token),
        expires_at=expires_at,
    )
    return token, session


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: DbSession) -> UserResponse:
    existing = await db.scalar(
        select(User.id).where(or_(User.email == str(data.email), User.username == data.username))
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email или имя пользователя уже заняты")

    user = User(
        email=str(data.email),
        username=data.username,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="Email или имя пользователя уже заняты"
        ) from None
    await db.refresh(user)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, db: DbSession) -> TokenPair:
    user = await db.scalar(select(User).where(User.email == str(data.email)))
    if user is None:
        verify_dummy_password(data.password)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт отключён")

    refresh_token, session = _new_session(user.id)
    db.add(session)
    await db.commit()
    return TokenPair(access_token=create_access_token(user.id), refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, db: DbSession) -> TokenPair:
    unauthorized = HTTPException(status_code=401, detail="Недействительный refresh-токен")
    try:
        payload = decode_token(data.refresh_token, "refresh")
        user_id = uuid.UUID(payload["sub"])
        jti = payload["jti"]
    except (TokenError, ValueError):
        raise unauthorized from None

    result = await db.execute(
        select(RefreshSession).where(RefreshSession.jti == jti).with_for_update()
    )
    old_session = result.scalar_one_or_none()
    now = datetime.now(UTC)
    if old_session is None or old_session.token_hash != token_fingerprint(data.refresh_token):
        raise unauthorized
    if old_session.revoked_at is not None:
        # Повторное применение уже заменённого токена похоже на кражу: закрываем все сессии.
        await db.execute(
            update(RefreshSession)
            .where(RefreshSession.user_id == user_id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.commit()
        raise unauthorized
    if _as_utc(old_session.expires_at) <= now:
        old_session.revoked_at = now
        await db.commit()
        raise unauthorized

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized

    refresh_token, new_session = _new_session(user.id)
    old_session.revoked_at = now
    old_session.replaced_by_jti = new_session.jti
    db.add(new_session)
    await db.commit()
    return TokenPair(access_token=create_access_token(user.id), refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, db: DbSession) -> Response:
    try:
        payload = decode_token(data.refresh_token, "refresh")
        session = await db.scalar(
            select(RefreshSession).where(RefreshSession.jti == payload["jti"])
        )
        if session is not None and session.token_hash == token_fingerprint(data.refresh_token):
            session.revoked_at = session.revoked_at or datetime.now(UTC)
            await db.commit()
    except TokenError:
        pass
    return Response(status_code=status.HTTP_204_NO_CONTENT)
