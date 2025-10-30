"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2023-10-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('user_name', sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint('user_id')
    )

    # Create chat_sessions table
    op.create_table(
        'chat_sessions',
        sa.Column('chat_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('chat_id'),
        sa.UniqueConstraint('session_id')
    )

    # Create messages table
    op.create_table(
        'messages',
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.String(length=128), nullable=False),
        sa.Column('sender', sa.String(length=10), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.session_id'], ),
        sa.PrimaryKeyConstraint('message_id')
    )

def downgrade():
    op.drop_table('messages')
    op.drop_table('chat_sessions')
    op.drop_table('users')