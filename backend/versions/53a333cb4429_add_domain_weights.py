"""add_domain_weights

Revision ID: 53a333cb4429
Revises: 02a9736f7d38
Create Date: 2025-11-13 13:05:59.461875

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = '53a333cb4429'
down_revision = '02a9736f7d38'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create domain_weights table
    op.create_table(
        'domain_weights',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orgs.id'), nullable=False),
        sa.Column('domain', sa.String(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )
    
    # Create indexes for better query performance
    op.create_index('ix_domain_weights_org_id', 'domain_weights', ['org_id'])
    op.create_index('ix_domain_weights_domain', 'domain_weights', ['domain'])
    
    # Create unique constraint to prevent duplicate domain weights per org
    op.create_unique_constraint('uq_domain_weights_org_domain', 'domain_weights', ['org_id', 'domain'])


def downgrade() -> None:
    op.drop_index('ix_domain_weights_domain', table_name='domain_weights')
    op.drop_index('ix_domain_weights_org_id', table_name='domain_weights')
    op.drop_table('domain_weights')
