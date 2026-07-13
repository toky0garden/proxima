import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import CurrentUser, DbSession
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.order import Order
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    MessageUpdate,
    ReadResult,
)
from app.services.orders import order_role

router = APIRouter()


def _participant_ids(first: uuid.UUID, second: uuid.UUID) -> tuple[uuid.UUID, uuid.UUID]:
    ordered = sorted((first, second), key=lambda value: value.int)
    return ordered[0], ordered[1]


def _direct_key(first: uuid.UUID, second: uuid.UUID) -> str:
    one, two = _participant_ids(first, second)
    return f"{one}:{two}"


async def _conversation_for_user(
    db: DbSession, conversation_id: uuid.UUID, user_id: uuid.UUID
) -> Conversation:
    conversation = await db.get(Conversation, conversation_id)
    if conversation is None or not conversation.includes(user_id):
        raise HTTPException(status_code=404, detail="Диалог не найден")
    return conversation


def _message_response(message: Message) -> MessageResponse:
    response = MessageResponse.model_validate(message)
    if message.deleted_at is not None:
        response.body = "Сообщение удалено"
    return response


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate, db: DbSession, current_user: CurrentUser
) -> ConversationResponse:
    if data.order_id is not None:
        order = await db.get(Order, data.order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Заказ не найден")
        order_role(order, current_user.id)
        conversation = await db.scalar(
            select(Conversation).where(Conversation.order_id == order.id)
        )
        if conversation is None:
            first, second = _participant_ids(order.buyer_id, order.seller_id)
            conversation = Conversation(
                participant_one_id=first,
                participant_two_id=second,
                order_id=order.id,
            )
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
        return ConversationResponse.model_validate(conversation)

    recipient_id = data.recipient_id
    if recipient_id == current_user.id:
        raise HTTPException(status_code=409, detail="Нельзя создать диалог с самим собой")
    recipient = await db.get(User, recipient_id)
    if recipient is None or not recipient.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    key = _direct_key(current_user.id, recipient.id)
    existing = await db.scalar(select(Conversation).where(Conversation.direct_key == key))
    if existing is not None:
        return ConversationResponse.model_validate(existing)

    first, second = _participant_ids(current_user.id, recipient.id)
    conversation = Conversation(
        participant_one_id=first,
        participant_two_id=second,
        direct_key=key,
    )
    db.add(conversation)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(select(Conversation).where(Conversation.direct_key == key))
        if existing is None:
            raise
        conversation = existing
    else:
        await db.refresh(conversation)
    return ConversationResponse.model_validate(conversation)


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    db: DbSession,
    current_user: CurrentUser,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[ConversationResponse]:
    unread = (
        select(func.count(Message.id))
        .where(
            Message.conversation_id == Conversation.id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
            Message.deleted_at.is_(None),
        )
        .correlate(Conversation)
        .scalar_subquery()
    )
    last_message = (
        select(Message.body)
        .where(Message.conversation_id == Conversation.id, Message.deleted_at.is_(None))
        .order_by(Message.created_at.desc())
        .limit(1)
        .correlate(Conversation)
        .scalar_subquery()
    )
    rows = await db.execute(
        select(Conversation, unread.label("unread_count"), last_message.label("last_message"))
        .where(
            (Conversation.participant_one_id == current_user.id)
            | (Conversation.participant_two_id == current_user.id)
        )
        .order_by(Conversation.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [
        ConversationResponse.model_validate(conversation).model_copy(
            update={"unread_count": count, "last_message": last}
        )
        for conversation, count, last in rows
    ]


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID, db: DbSession, current_user: CurrentUser
) -> ConversationResponse:
    conversation = await _conversation_for_user(db, conversation_id, current_user.id)
    return ConversationResponse.model_validate(conversation)


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
    before_id: uuid.UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> list[MessageResponse]:
    await _conversation_for_user(db, conversation_id, current_user.id)
    query = select(Message).where(Message.conversation_id == conversation_id)
    if before_id is not None:
        before = await db.get(Message, before_id)
        if before is None or before.conversation_id != conversation_id:
            raise HTTPException(status_code=404, detail="Сообщение-курсор не найдено")
        query = query.where(Message.created_at < before.created_at)
    messages = await db.scalars(query.order_by(Message.created_at.desc()).limit(limit))
    return [_message_response(message) for message in messages]


@router.post(
    "/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    conversation_id: uuid.UUID,
    data: MessageCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> MessageResponse:
    conversation = await _conversation_for_user(db, conversation_id, current_user.id)
    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        body=data.body.strip(),
    )
    if not message.body:
        raise HTTPException(status_code=422, detail="Сообщение не может быть пустым")
    db.add(message)
    conversation.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(message)
    return _message_response(message)


@router.patch("/{conversation_id}/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    data: MessageUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> MessageResponse:
    await _conversation_for_user(db, conversation_id, current_user.id)
    message = await db.get(Message, message_id)
    if (
        message is None
        or message.conversation_id != conversation_id
        or message.sender_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    if message.deleted_at is not None:
        raise HTTPException(status_code=409, detail="Удалённое сообщение нельзя изменить")
    body = data.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="Сообщение не может быть пустым")
    message.body = body
    await db.commit()
    await db.refresh(message)
    return _message_response(message)


@router.delete("/{conversation_id}/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> Response:
    await _conversation_for_user(db, conversation_id, current_user.id)
    message = await db.get(Message, message_id)
    if (
        message is None
        or message.conversation_id != conversation_id
        or message.sender_id != current_user.id
    ):
        raise HTTPException(status_code=404, detail="Сообщение не найдено")
    message.deleted_at = message.deleted_at or datetime.now(UTC)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{conversation_id}/read", response_model=ReadResult)
async def mark_conversation_read(
    conversation_id: uuid.UUID, db: DbSession, current_user: CurrentUser
) -> ReadResult:
    await _conversation_for_user(db, conversation_id, current_user.id)
    result = await db.execute(
        update(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.read_at.is_(None),
        )
        .values(read_at=datetime.now(UTC))
    )
    await db.commit()
    return ReadResult(updated=result.rowcount or 0)
