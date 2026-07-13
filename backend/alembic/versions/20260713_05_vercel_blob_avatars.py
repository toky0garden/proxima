"""store avatar files in Vercel Blob

Revision ID: 20260713_05
Revises: 20260713_04
Create Date: 2026-07-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260713_05"
down_revision: str | Sequence[str] | None = "20260713_04"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("avatars") as batch_op:
        batch_op.add_column(sa.Column("url", sa.String(length=2048), nullable=True))
        batch_op.add_column(sa.Column("pathname", sa.String(length=1024), nullable=True))
        batch_op.alter_column(
            "data",
            existing_type=sa.LargeBinary(),
            nullable=True,
        )


def downgrade() -> None:
    # Blob-backed rows cannot be represented by the old database-only schema.
    op.execute(
        sa.text(
            "UPDATE users SET avatar_url = NULL "
            "WHERE id IN (SELECT user_id FROM avatars WHERE data IS NULL)"
        )
    )
    op.execute(sa.text("DELETE FROM avatars WHERE data IS NULL"))
    with op.batch_alter_table("avatars") as batch_op:
        batch_op.alter_column(
            "data",
            existing_type=sa.LargeBinary(),
            nullable=False,
        )
        batch_op.drop_column("pathname")
        batch_op.drop_column("url")
