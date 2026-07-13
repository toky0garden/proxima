import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    avatar_url: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime


class PublicUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    username: str
    avatar_url: str | None
    is_verified: bool
    created_at: datetime


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None, min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_]+$"
    )

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str | None) -> str | None:
        return value.strip().lower() if value is not None else None
