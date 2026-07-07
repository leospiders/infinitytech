"""add deleted_at to employees

Revision ID: 9e8f7d6c5b4a
Revises: 74840bcf89f9
Create Date: 2026-06-15 21:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "9e8f7d6c5b4a"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("employees", sa.Column("deleted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("employees", "deleted_at")
