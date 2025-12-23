"""allow user_id null in chat_session for guest mode

Revision ID: 5baa1a56d0b6
Revises: 001_initial
Create Date: 2025-11-23 04:08:40.239904

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5baa1a56d0b6'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade():
    # Use a guarded SQL statement so deployments where the table
    # does not yet exist (e.g. new Neon branch) won't fail the upgrade.
    op.execute(
        """
        ALTER TABLE IF EXISTS chat_session
        ALTER COLUMN user_id DROP NOT NULL;
        """
    )


def downgrade():
    # Guarded reverse operation: set NOT NULL only if the table exists.
    op.execute(
        """
        ALTER TABLE IF EXISTS chat_session
        ALTER COLUMN user_id SET NOT NULL;
        """
    )
