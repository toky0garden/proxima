import uuid

from fastapi import HTTPException

from app.models.order import Order

TERMINAL_STATUSES = {"completed", "cancelled"}

ALLOWED_TRANSITIONS: dict[str, dict[str, set[str]]] = {
    "pending": {
        "buyer": {"cancelled"},
        "seller": {"accepted", "cancelled"},
    },
    "accepted": {
        "buyer": {"disputed"},
        "seller": {"in_progress", "cancelled"},
    },
    "in_progress": {
        "buyer": {"disputed"},
        "seller": {"delivered"},
    },
    "delivered": {
        "buyer": {"completed", "disputed"},
        "seller": {"in_progress"},
    },
    # Покупатель может принять результат, продавец — добровольно отменить заказ.
    "disputed": {"buyer": {"completed"}, "seller": {"cancelled"}},
    "completed": {"buyer": set(), "seller": set()},
    "cancelled": {"buyer": set(), "seller": set()},
}


def order_role(order: Order, user_id: uuid.UUID) -> str:
    if order.buyer_id == user_id:
        return "buyer"
    if order.seller_id == user_id:
        return "seller"
    raise HTTPException(status_code=404, detail="Заказ не найден")


def ensure_visible(order: Order, user_id: uuid.UUID) -> str:
    role = order_role(order, user_id)
    deleted_at = order.buyer_deleted_at if role == "buyer" else order.seller_deleted_at
    if deleted_at is not None:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return role


def validate_transition(order: Order, user_id: uuid.UUID, new_status: str) -> None:
    role = order_role(order, user_id)
    if new_status == order.status:
        raise HTTPException(status_code=409, detail="Заказ уже имеет этот статус")
    allowed = ALLOWED_TRANSITIONS.get(order.status, {}).get(role, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=409,
            detail=f"Переход {order.status} → {new_status} недоступен для роли {role}",
        )
