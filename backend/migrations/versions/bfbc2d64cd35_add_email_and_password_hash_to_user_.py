"""Add email and password_hash to User model for auth

Revision ID: bfbc2d64cd35
Revises: 5baa1a56d0b6
Create Date: 2025-11-23 15:53:09.978037

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bfbc2d64cd35'
down_revision = '5baa1a56d0b6'
branch_labels = None
depends_on = None


def upgrade():
    # This migration is now a no-op since the initial migration creates all these columns.
    # Keeping it for migration history compatibility on existing databases.
    # Check if email column exists, add it only if missing (for old databases).
    op.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user' AND column_name = 'email'
            ) THEN
                ALTER TABLE "user" ADD COLUMN email VARCHAR(128) NOT NULL DEFAULT '';
                CREATE INDEX ix_user_email ON "user"(email);
            END IF;
        END $$;
        """
    )


def downgrade():
    # Downgrade is a no-op since the initial migration owns the schema.
    pass
