"""add items_sold column to weekly_snapshots

Revision ID: d4e5f6a7b8c9
Revises: ef5fd6b9d5c8
Create Date: 2026-07-07 09:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'ef5fd6b9d5c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('weekly_snapshots', sa.Column('items_sold', sa.Integer(), nullable=False, server_default='0'))
    op.execute("UPDATE weekly_snapshots SET items_sold = 0 WHERE items_sold IS NULL")


def downgrade() -> None:
    op.drop_column('weekly_snapshots', 'items_sold')
