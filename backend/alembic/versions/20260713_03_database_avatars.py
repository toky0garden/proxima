"""store avatars in database

Revision ID: 20260713_03
Revises: 20260713_02
Create Date: 2026-07-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260713_03"
down_revision: str | Sequence[str] | None = "20260713_02"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "avatars",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("content_type", sa.String(length=50), nullable=False),
        sa.Column("data", sa.LargeBinary(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_avatars_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_avatars")),
    )
    op.create_index(op.f("ix_avatars_user_id"), "avatars", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("avatars")
