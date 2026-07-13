import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ConversationCreate(BaseModel):
    recipient_id: uuid.UUID | None = None
    order_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def exactly_one_target(self):
        if (self.recipient_id is None) == (self.order_id is None):
            raise ValueError("Укажите recipient_id или order_id")
        return self


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    participant_one_id: uuid.UUID
    participant_two_id: uuid.UUID
    order_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    unread_count: int = 0
    last_message: str | None = None


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessageUpdate(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    read_at: datetime | None
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ReadResult(BaseModel):
    updated: int
