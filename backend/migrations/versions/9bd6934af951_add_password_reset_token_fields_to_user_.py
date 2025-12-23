"""Add password reset token fields to User model

Revision ID: 9bd6934af951
Revises: bfbc2d64cd35
Create Date: 2025-11-29 08:43:18.652972

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9bd6934af951'
down_revision = 'bfbc2d64cd35'
branch_labels = None
depends_on = None


def upgrade():
    # Safe to run on new or existing databases - columns created by initial migration
    # or safely added if missing on legacy databases.
    op.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user' AND column_name = 'reset_token'
            ) THEN
                ALTER TABLE "user" ADD COLUMN reset_token VARCHAR(128) DEFAULT NULL;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user' AND column_name = 'reset_token_expiration'
            ) THEN
                ALTER TABLE "user" ADD COLUMN reset_token_expiration TIMESTAMP DEFAULT NULL;
            END IF;
        END $$;
        """
    )


def downgrade():
    # No-op downgrade
    pass
