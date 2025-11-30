from functools import wraps
from flask import abort, jsonify
from flask_login import current_user, login_required

def admin_required(f):
    """
    Decorator that checks if the current logged-in user is an admin.
    Must be used *after* @login_required.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # The login_required decorator ensures current_user is authenticated
        if not current_user.is_admin:
            return jsonify({
                "message": "Administration access required."
            }), 403 
        return f(*args, **kwargs)
    return decorated_function