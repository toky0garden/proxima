import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.models.message import Message
    from app.models.order import Order
    from app.models.user import User


class Conversation(UUIDTimestampMixin, Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("direct_key", name="uq_conversations_direct_key"),)

    participant_one_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    participant_two_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=True
    )
    direct_key: Mapped[str | None] = mapped_column(String(73), nullable=True)

    participant_one: Mapped["User"] = relationship(foreign_keys=[participant_one_id])
    participant_two: Mapped["User"] = relationship(foreign_keys=[participant_two_id])
    order: Mapped["Order | None"] = relationship(back_populates="conversation")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan"
    )

    def includes(self, user_id: uuid.UUID) -> bool:
        return user_id in (self.participant_one_id, self.participant_two_id)
