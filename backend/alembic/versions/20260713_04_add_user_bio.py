"""add optional user bio

Revision ID: 20260713_04
Revises: 20260713_03
Create Date: 2026-07-13
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260713_04"
down_revision: str | Sequence[str] | None = "20260713_03"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _user_columns() -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns("users")}


def upgrade() -> None:
    # Some early local databases already received this field before the migration
    # was formalized. The guard keeps those databases upgradeable as well.
    if "bio" not in _user_columns():
        op.add_column("users", sa.Column("bio", sa.String(length=1000), nullable=True))


def downgrade() -> None:
    if "bio" in _user_columns():
        op.drop_column("users", "bio")
