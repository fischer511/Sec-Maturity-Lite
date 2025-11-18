"""Add remediation_tasks table

Revision ID: 006
Revises: 005
Create Date: 2025-11-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create task_status enum
    task_status = postgresql.ENUM('todo', 'in_progress', 'completed', 'cancelled', name='taskstatus')
    task_status.create(op.get_bind(), checkfirst=True)
    
    # Create task_priority enum
    task_priority = postgresql.ENUM('low', 'medium', 'high', 'critical', name='taskpriority')
    task_priority.create(op.get_bind(), checkfirst=True)
    
    # Create remediation_tasks table
    op.create_table(
        'remediation_tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assessment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recommendation_id', sa.String(length=50), nullable=True),
        sa.Column('domain', sa.String(length=50), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('assignee_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', task_status, nullable=False),
        sa.Column('priority', task_priority, nullable=False),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['org_id'], ['orgs.id'], ),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_remediation_tasks_assessment_id'), 'remediation_tasks', ['assessment_id'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_org_id'), 'remediation_tasks', ['org_id'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_assignee_id'), 'remediation_tasks', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_status'), 'remediation_tasks', ['status'], unique=False)
    op.create_index(op.f('ix_remediation_tasks_priority'), 'remediation_tasks', ['priority'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_remediation_tasks_priority'), table_name='remediation_tasks')
    op.drop_index(op.f('ix_remediation_tasks_status'), table_name='remediation_tasks')
    op.drop_index(op.f('ix_remediation_tasks_assignee_id'), table_name='remediation_tasks')
    op.drop_index(op.f('ix_remediation_tasks_org_id'), table_name='remediation_tasks')
    op.drop_index(op.f('ix_remediation_tasks_assessment_id'), table_name='remediation_tasks')
    
    # Drop table
    op.drop_table('remediation_tasks')
    
    # Drop enums
    sa.Enum(name='taskpriority').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='taskstatus').drop(op.get_bind(), checkfirst=True)
