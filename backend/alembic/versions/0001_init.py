from alembic import op
import sqlalchemy as sa


revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('uid', sa.String(128), nullable=False, unique=True),
        sa.Column('email', sa.String(255)),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'documents',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('s3_key', sa.String(1024), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('job_uuid', sa.String(64), nullable=False, unique=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),
        sa.Column('document_id', sa.Integer, sa.ForeignKey('documents.id'), nullable=False),
        sa.Column('status', sa.String(32), nullable=False, server_default='PENDING'),
        sa.Column('meta', sa.Text()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        'results',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('job_id', sa.Integer, sa.ForeignKey('jobs.id'), nullable=False),
        sa.Column('probability', sa.Float()),
        sa.Column('summary', sa.Text()),
        sa.Column('feature_summary', sa.Text()),
        sa.Column('latency_ms', sa.Integer()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('results')
    op.drop_table('jobs')
    op.drop_table('documents')
    op.drop_table('users')


