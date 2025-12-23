"""Create initial schema with user, chat_session, and message tables using raw SQL

Revision ID: 000_init_raw_sql
Revises: 
Create Date: 2025-12-23 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '000_init_raw_sql'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create user table with all fields
    op.execute("""
        CREATE TABLE IF NOT EXISTS "user" (
            user_id SERIAL PRIMARY KEY,
            user_name VARCHAR(128) NOT NULL,
            email VARCHAR(128) NOT NULL UNIQUE,
            password_hash VARCHAR(128) NOT NULL,
            created_at TIMESTAMP DEFAULT NULL,
            is_admin BOOLEAN DEFAULT false,
            reset_token VARCHAR(128) DEFAULT NULL,
            reset_token_expiration TIMESTAMP DEFAULT NULL
        )
    """)
    
    # Create index on user email
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_user_email ON "user"(email)
    """)

    # Create chat_session table
    op.execute("""
        CREATE TABLE IF NOT EXISTS chat_session (
            chat_id SERIAL PRIMARY KEY,
            user_id INTEGER DEFAULT NULL REFERENCES "user"(user_id),
            session_uuid VARCHAR(128) NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT NULL
        )
    """)
    
    # Create indexes on chat_session
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_chat_session_user_id ON chat_session(user_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_chat_session_created_at ON chat_session(created_at)
    """)

    # Create message table
    op.execute("""
        CREATE TABLE IF NOT EXISTS message (
            message_id SERIAL PRIMARY KEY,
            chat_id INTEGER NOT NULL REFERENCES chat_session(chat_id),
            sender VARCHAR(10) DEFAULT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT NULL
        )
    """)
    
    # Create indexes on message
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_message_chat_id ON message(chat_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_message_timestamp ON message(timestamp)
    """)


def downgrade():
    # Drop message table
    op.execute("DROP TABLE IF EXISTS message CASCADE")
    
    # Drop chat_session table
    op.execute("DROP TABLE IF EXISTS chat_session CASCADE")
    
    # Drop user table
    op.execute("DROP TABLE IF EXISTS \"user\" CASCADE")
