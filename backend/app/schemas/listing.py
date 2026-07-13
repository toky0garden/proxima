import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_validator


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=10_000)
    category: str = Field(min_length=2, max_length=64)
    price_minor: int = Field(ge=0, le=1_000_000_000)
    currency: str = Field(default="RUB", min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")
    delivery_days: int = Field(ge=1, le=365)

    @field_validator("title", "description", "category")
    @classmethod
    def strip_text(cls, value: str, info: ValidationInfo) -> str:
        value = value.strip()
        minimum = {"title": 3, "description": 10, "category": 2}[info.field_name]
        if len(value) < minimum:
            raise ValueError(f"Минимальная длина после удаления пробелов: {minimum}")
        return value

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        return value.lower()

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class ListingUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = Field(default=None, min_length=10, max_length=10_000)
    category: str | None = Field(default=None, min_length=2, max_length=64)
    price_minor: int | None = Field(default=None, ge=0, le=1_000_000_000)
    currency: str | None = Field(default=None, min_length=3, max_length=3, pattern=r"^[A-Za-z]{3}$")
    delivery_days: int | None = Field(default=None, ge=1, le=365)
    is_active: bool | None = None

    @field_validator("title", "description", "category")
    @classmethod
    def strip_text(cls, value: str | None, info: ValidationInfo) -> str | None:
        if value is None:
            return None
        value = value.strip()
        minimum = {"title": 3, "description": 10, "category": 2}[info.field_name]
        if len(value) < minimum:
            raise ValueError(f"Минимальная длина после удаления пробелов: {minimum}")
        return value

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str | None) -> str | None:
        return value.lower() if value is not None else None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        return value.upper() if value is not None else None


class ListingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    seller_id: uuid.UUID
    title: str
    description: str
    category: str
    price_minor: int
    currency: str
    delivery_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
