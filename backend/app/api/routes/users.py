import uuid
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models.avatar import Avatar
from app.models.user import User
from app.schemas.user import PublicUserResponse, UserResponse, UserUpdate
from app.services.avatars import prepare_avatar

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, db: DbSession, current_user: CurrentUser) -> UserResponse:
    if not data.model_fields_set:
        raise HTTPException(status_code=422, detail="Не переданы изменения")
    if "username" in data.model_fields_set:
        if data.username is None:
            raise HTTPException(status_code=422, detail="username нельзя удалить")
        owner_id = await db.scalar(select(User.id).where(User.username == data.username))
        if owner_id is not None and owner_id != current_user.id:
            raise HTTPException(status_code=409, detail="Имя пользователя уже занято")
        current_user.username = data.username
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Имя пользователя уже занято") from None
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    db: DbSession,
    current_user: CurrentUser,
    file: Annotated[UploadFile, File()],
) -> UserResponse:
    avatar_data = await prepare_avatar(file)
    avatar = await db.scalar(select(Avatar).where(Avatar.user_id == current_user.id))
    if avatar is None:
        avatar = Avatar(user_id=current_user.id, data=avatar_data)
        db.add(avatar)
        await db.flush()
    else:
        avatar.data = avatar_data
    current_user.avatar_url = f"/api/v1/users/avatars/{avatar.id}"
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.delete("/me/avatar", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(db: DbSession, current_user: CurrentUser) -> Response:
    avatar = await db.scalar(select(Avatar).where(Avatar.user_id == current_user.id))
    current_user.avatar_url = None
    if avatar is not None:
        await db.delete(avatar)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/avatars/{avatar_id}")
async def get_avatar(avatar_id: uuid.UUID, db: DbSession) -> Response:
    avatar = await db.get(Avatar, avatar_id)
    if avatar is None:
        raise HTTPException(status_code=404, detail="Аватар не найден")
    return Response(
        content=avatar.data,
        media_type=avatar.content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.get("/{user_id}", response_model=PublicUserResponse)
async def get_public_profile(user_id: uuid.UUID, db: DbSession) -> PublicUserResponse:
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return PublicUserResponse.model_validate(user)
