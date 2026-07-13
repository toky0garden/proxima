import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrderStatus(StrEnum):
    pending = "pending"
    accepted = "accepted"
    in_progress = "in_progress"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"
    disputed = "disputed"


class OrderCreate(BaseModel):
    listing_id: uuid.UUID
    requirements: str = Field(min_length=3, max_length=10_000)

    @field_validator("requirements")
    @classmethod
    def strip_requirements(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Описание заказа должно содержать минимум 3 символа")
        return value


class OrderUpdate(BaseModel):
    requirements: str = Field(min_length=3, max_length=10_000)
    version: int = Field(ge=1)

    @field_validator("requirements")
    @classmethod
    def strip_requirements(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Описание заказа должно содержать минимум 3 символа")
        return value


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    version: int = Field(ge=1)


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    listing_id: uuid.UUID
    buyer_id: uuid.UUID
    seller_id: uuid.UUID
    title: str
    requirements: str
    price_minor: int
    currency: str
    status: OrderStatus
    version: int
    created_at: datetime
    updated_at: datetime
