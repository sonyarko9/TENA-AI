"""Added unique constraint to User.email and updated reset token fields

Revision ID: 3b84ad2a71b1
Revises: 9bd6934af951
Create Date: 2025-11-29 12:06:07.789640

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3b84ad2a71b1'
down_revision = '9bd6934af951'
branch_labels = None
depends_on = None


def upgrade():
    # Safe to run - handles both new databases (where email is already unique)
    # and legacy ones (where it may not be).
    op.execute(
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'user' AND column_name = 'is_admin'
            ) THEN
                ALTER TABLE "user" ADD COLUMN is_admin BOOLEAN DEFAULT NULL;
            END IF;
        END $$;
        """
    )
    # Drop old non-unique index if it exists, recreate as unique
    op.execute(
        """
        DO $$ BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'user' AND indexname = 'ix_user_email' 
                AND NOT indexdef LIKE '%UNIQUE%'
            ) THEN
                DROP INDEX IF EXISTS ix_user_email;
                CREATE UNIQUE INDEX ix_user_email ON "user"(email);
            END IF;
        END $$;
        """
    )


def downgrade():
    # No-op downgrade
    pass
