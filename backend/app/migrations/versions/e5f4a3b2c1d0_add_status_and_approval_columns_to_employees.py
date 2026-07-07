"""add status and approval columns to employees

Revision ID: e5f4a3b2c1d0
Revises: 9e8f7d6c5b4a
Create Date: 2026-06-15 21:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f4a3b2c1d0"
down_revision: Union[str, Sequence[str], None] = "9e8f7d6c5b4a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("status", sa.String(length=20), server_default="PENDING", nullable=False))
    op.add_column("employees", sa.Column("approved_by", sa.String(length=36), nullable=True))
    op.add_column("employees", sa.Column("approved_at", sa.DateTime(), nullable=True))
    op.add_column("employees", sa.Column("rejected_by", sa.String(length=36), nullable=True))
    op.add_column("employees", sa.Column("rejected_at", sa.DateTime(), nullable=True))
    op.add_column("employees", sa.Column("rejection_reason", sa.String(length=500), nullable=True))
    op.add_column("employees", sa.Column("last_login", sa.DateTime(), nullable=True))

    # Backfill existing employees with appropriate status
    op.execute("""
        UPDATE employees
        SET status = CASE
            WHEN is_active = 1 AND deleted_at IS NULL THEN 'ACTIVE'
            WHEN is_active = 0 AND deleted_at IS NULL THEN 'PENDING'
            WHEN deleted_at IS NOT NULL THEN 'DELETED'
            ELSE 'PENDING'
        END
    """)


def downgrade() -> None:
    op.drop_column("employees", "last_login")
    op.drop_column("employees", "rejection_reason")
    op.drop_column("employees", "rejected_at")
    op.drop_column("employees", "rejected_by")
    op.drop_column("employees", "approved_at")
    op.drop_column("employees", "approved_by")
    op.drop_column("employees", "status")
