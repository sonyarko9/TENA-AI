"""Create initial schema with user, chat_session, and message tables

Revision ID: 001_initial
Revises: 
Create Date: 2025-12-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create user table
    op.create_table(
        'user',
        sa.Column('user_id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_name', sa.String(length=128), nullable=False),
        sa.Column('email', sa.String(length=128), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('reset_token', sa.String(length=128), nullable=True),
        sa.Column('reset_token_expiration', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('email', name='uq_user_email')
    )
    op.create_index('ix_user_email', 'user', ['email'], unique=True)

    # Create chat_session table
    op.create_table(
        'chat_session',
        sa.Column('chat_id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('session_uuid', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('chat_id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.user_id']),
        sa.UniqueConstraint('session_uuid', name='uq_chat_session_uuid')
    )
    op.create_index('ix_chat_session_user_id', 'chat_session', ['user_id'], unique=False)
    op.create_index('ix_chat_session_created_at', 'chat_session', ['created_at'], unique=False)

    # Create message table
    op.create_table(
        'message',
        sa.Column('message_id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('chat_id', sa.Integer(), nullable=False),
        sa.Column('sender', sa.String(length=10), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('message_id'),
        sa.ForeignKeyConstraint(['chat_id'], ['chat_session.chat_id'])
    )
    op.create_index('ix_message_chat_id', 'message', ['chat_id'], unique=False)
    op.create_index('ix_message_timestamp', 'message', ['timestamp'], unique=False)


def downgrade():
    # Drop indexes - use IF EXISTS to be safe
    op.execute("DROP INDEX IF EXISTS ix_message_timestamp")
    op.execute("DROP INDEX IF EXISTS ix_message_chat_id")
    
    # Drop message table
    op.drop_table('message')

    # Drop indexes
    op.execute("DROP INDEX IF EXISTS ix_chat_session_created_at")
    op.execute("DROP INDEX IF EXISTS ix_chat_session_user_id")
    
    # Drop chat_session table
    op.drop_table('chat_session')

    # Drop indexes
    op.execute("DROP INDEX IF EXISTS ix_user_email")
    
    # Drop user table
    op.drop_table('user')
