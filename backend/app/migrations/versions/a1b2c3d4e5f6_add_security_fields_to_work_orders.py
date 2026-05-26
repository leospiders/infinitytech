"""add security_type and security_value to work_orders

Revision ID: a1b2c3d4e5f6
Revises: 74840bcf89f9
Create Date: 2026-05-25 22:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '74840bcf89f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('work_orders', sa.Column('security_type', sa.String(length=20), nullable=True))
    op.add_column('work_orders', sa.Column('security_value', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('work_orders', 'security_value')
    op.drop_column('work_orders', 'security_type')
