import uuid
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import and_, or_, select

from app.api.deps import CurrentUser, DbSession
from app.models.conversation import Conversation
from app.models.listing import Listing
from app.models.order import Order
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatus,
    OrderStatusUpdate,
    OrderUpdate,
)
from app.services.orders import TERMINAL_STATUSES, ensure_visible, validate_transition

router = APIRouter()


async def _locked_order(db: DbSession, order_id: uuid.UUID) -> Order:
    order = await db.scalar(select(Order).where(Order.id == order_id).with_for_update())
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(data: OrderCreate, db: DbSession, current_user: CurrentUser) -> Order:
    listing = await db.get(Listing, data.listing_id)
    if listing is None or not listing.is_active:
        raise HTTPException(status_code=404, detail="Услуга не найдена или отключена")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=409, detail="Нельзя заказать собственную услугу")

    order = Order(
        listing_id=listing.id,
        buyer_id=current_user.id,
        seller_id=listing.seller_id,
        title=listing.title,
        requirements=data.requirements,
        price_minor=listing.price_minor,
        currency=listing.currency,
    )
    db.add(order)
    await db.flush()
    first, second = sorted((current_user.id, listing.seller_id), key=lambda value: value.int)
    db.add(
        Conversation(
            participant_one_id=first,
            participant_two_id=second,
            order_id=order.id,
        )
    )
    await db.commit()
    await db.refresh(order)
    return order


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    db: DbSession,
    current_user: CurrentUser,
    role: Literal["all", "buyer", "seller"] = "all",
    order_status: Annotated[OrderStatus | None, Query(alias="status")] = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list[Order]:
    buyer_condition = and_(
        Order.buyer_id == current_user.id,
        Order.buyer_deleted_at.is_(None),
    )
    seller_condition = and_(
        Order.seller_id == current_user.id,
        Order.seller_deleted_at.is_(None),
    )
    if role == "buyer":
        query = select(Order).where(buyer_condition)
    elif role == "seller":
        query = select(Order).where(seller_condition)
    else:
        query = select(Order).where(or_(buyer_condition, seller_condition))
    if order_status is not None:
        query = query.where(Order.status == order_status.value)
    result = await db.scalars(query.order_by(Order.created_at.desc()).offset(offset).limit(limit))
    return list(result)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> Order:
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    ensure_visible(order, current_user.id)
    return order


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: uuid.UUID, data: OrderUpdate, db: DbSession, current_user: CurrentUser
) -> Order:
    order = await _locked_order(db, order_id)
    ensure_visible(order, current_user.id)
    if order.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Только покупатель может менять описание заказа"
        )
    if order.status != "pending":
        raise HTTPException(status_code=409, detail="Редактировать можно только ожидающий заказ")
    if order.version != data.version:
        raise HTTPException(status_code=409, detail="Заказ уже изменён; обновите данные")
    order.requirements = data.requirements
    order.version += 1
    await db.commit()
    await db.refresh(order)
    return order


@router.post("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> Order:
    order = await _locked_order(db, order_id)
    ensure_visible(order, current_user.id)
    if order.version != data.version:
        raise HTTPException(status_code=409, detail="Заказ уже изменён; обновите данные")
    validate_transition(order, current_user.id, data.status.value)
    order.status = data.status.value
    order.version += 1
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: uuid.UUID, db: DbSession, current_user: CurrentUser) -> Response:
    order = await _locked_order(db, order_id)
    role = ensure_visible(order, current_user.id)
    if order.status not in TERMINAL_STATUSES:
        if order.status != "pending":
            raise HTTPException(
                status_code=409,
                detail="Скрыть можно завершённый/отменённый заказ либо отменить ожидающий",
            )
        order.status = "cancelled"
        order.version += 1
    now = datetime.now(UTC)
    if role == "buyer":
        order.buyer_deleted_at = now
    else:
        order.seller_deleted_at = now
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
