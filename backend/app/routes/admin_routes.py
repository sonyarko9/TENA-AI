from flask import Blueprint, jsonify, request
from app.models import User, ChatSession, Message, db
from app.utils import admin_required
from sqlalchemy import text
from flask_login import login_required 
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin_api", __name__, url_prefix="/api/admin")

@admin_bp.get("/metrics/system") 
@login_required
def system_metrics():
    """Returns application health metrics."""
    try:
        total_users = db.session.query(User).count()
        total_chats = db.session.query(ChatSession).count()
        total_messages = db.session.query(Message).count()

        return jsonify({
            'total_users': total_users,
            'total_chats': total_chats,
            'total_messages': total_messages,
        }), 200

    except Exception as e:
        print(f"Error fetching system metrics: {e}")
        return jsonify({'error': 'Failed to fetch system metrics due to a server error.'}), 500

@admin_bp.get("/users")
@login_required
def get_users():
    """Returns a list of all users with non-sensitive data."""
    try:
        users = User.query.all()
        user_list = [
            {
                'id': user.user_id,
                'email': user.email,
                'name': user.user_name,
                'is_admin': user.is_admin
            }
            for user in users
        ]
        return jsonify({'users': user_list}), 200
    
    except Exception as e:
        print(f"Error fetching user list: {e}")
        return jsonify({'error': 'Failed to fetch user list.'}), 500


@admin_bp.post("/delete-all-users")
@login_required
@admin_required
def delete_all_users():
    """Wipes the entire database and resets ID sequences."""
    num_deleted = 0
    try:
        if db.engine.driver == 'psycopg2': 
            tables = ['"user"', 'chat_session', 'message']
            
            for table_name in tables:
                # TRUNCATE RESTART IDENTITY CASCADE handles deletion order and sequence reset
                db.session.execute(text(f'TRUNCATE TABLE {table_name} RESTART IDENTITY CASCADE;'))
            
            num_deleted = None 
        
        else: 
            # --- SQLite Logic ---
            
            # Delete dependent data first (Messages, then ChatSessions) due to foreign keys.
            db.session.query(Message).delete()
            db.session.query(ChatSession).delete()
            
            # Delete main User data and capture count.
            num_deleted = db.session.query(User).delete()
            
            # Reset auto-increment counters using the specific SQLite table: sqlite_sequence
            db.session.execute(text('DELETE FROM sqlite_sequence WHERE name="user";'))
            db.session.execute(text('DELETE FROM sqlite_sequence WHERE name="chat_session";'))
            db.session.execute(text('DELETE FROM sqlite_sequence WHERE name="message";'))
            
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully deleted all user data, chat sessions, and messages. Database ID sequences have been reset to 1.',
            'count_deleted': num_deleted 
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Database reset error: {e}")
        return jsonify({'error': f'Failed to wipe database: {str(e)}'}), 500