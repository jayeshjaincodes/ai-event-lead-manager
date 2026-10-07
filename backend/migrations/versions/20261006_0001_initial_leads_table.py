"""Initial leads table with UUID, follow-up status enum, timestamps, and indexes

Revision ID: 20261006_0001
Revises: 
Create Date: 2026-10-06 10:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20261006_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Controlled follow-up status enum
STATUS_VALUES = (
    'Not Contacted',
    'Follow Up',
    'Contacted',
    'Qualified',
    'Converted',
    'Not Interested',
)


def upgrade() -> None:
    # 1. Define the PostgreSQL Enum type
    status_enum = postgresql.ENUM(*STATUS_VALUES, name='follow_up_status_enum', create_type=True)
    status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Create the 'leads' table
    op.create_table(
        'leads',
        sa.Column(
            'id',
            sa.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('company', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('event', sa.String(length=255), nullable=False),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.Column(
            'follow_up_status',
            postgresql.ENUM(*STATUS_VALUES, name='follow_up_status_enum', create_type=False),
            server_default=sa.text("'Not Contacted'"),
            nullable=False,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "follow_up_status IN ('Not Contacted', 'Follow Up', 'Contacted', 'Qualified', 'Converted', 'Not Interested')",
            name='ck_leads_follow_up_status',
        ),
    )

    # 3. Create indexes for filtering, sorting, and search
    op.create_index('ix_leads_follow_up_status', 'leads', ['follow_up_status'], unique=False)
    op.create_index('ix_leads_created_at', 'leads', ['created_at'], unique=False)
    op.create_index('ix_leads_status_created_at', 'leads', ['follow_up_status', 'created_at'], unique=False)
    op.create_index('ix_leads_name', 'leads', ['name'], unique=False)
    op.create_index('ix_leads_company', 'leads', ['company'], unique=False)
    op.create_index('ix_leads_email', 'leads', ['email'], unique=False)
    op.create_index('ix_leads_event', 'leads', ['event'], unique=False)


def downgrade() -> None:
    # 1. Drop indexes
    op.drop_index('ix_leads_event', table_name='leads')
    op.drop_index('ix_leads_email', table_name='leads')
    op.drop_index('ix_leads_company', table_name='leads')
    op.drop_index('ix_leads_name', table_name='leads')
    op.drop_index('ix_leads_status_created_at', table_name='leads')
    op.drop_index('ix_leads_created_at', table_name='leads')
    op.drop_index('ix_leads_follow_up_status', table_name='leads')

    # 2. Drop table
    op.drop_table('leads')

    # 3. Drop native enum type if on PostgreSQL
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        status_enum = postgresql.ENUM(*STATUS_VALUES, name='follow_up_status_enum')
        status_enum.drop(bind, checkfirst=True)
