from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDTimestampMixin

if TYPE_CHECKING:
    from app.models.avatar import Avatar
    from app.models.listing import Listing
    from app.models.refresh_session import RefreshSession


class User(UUIDTimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    listings: Mapped[list["Listing"]] = relationship(
        back_populates="seller", cascade="all, delete-orphan"
    )
    avatar: Mapped["Avatar | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
