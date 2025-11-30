# app/routes/auth_routes.py

from flask import Blueprint, request, jsonify, current_app
from app.models import User, db
from app import bcrypt
from flask_login import login_user, logout_user, current_user, login_required
from sqlalchemy.exc import IntegrityError # Not strictly needed here, but kept for context

auth_bp = Blueprint("auth_api", __name__, url_prefix="/api/auth")

# --- Authentication & Account Management ---

@auth_bp.route("/status", methods=["GET"])
def status():
    """Checks the authentication status of the current user."""
    if current_user.is_authenticated:
        return jsonify({
            'isAuthenticated': True,
            'user_id': current_user.user_id,
            'email': current_user.email
        }), 200
    else:
        return jsonify({'isAuthenticated': False}), 200     

@auth_bp.route("/register", methods=["POST"])
def register():
    """Handles new user registration."""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
    
    email = data['email']
    password = data['password']
    
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': f' A user with email {email} already exists'}), 409
    
    try:
        # NOTE: Assumes user_name is created from email in your model
        # You must ensure the set_password or bcrypt logic is available
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            email=email, 
            password_hash=hashed_password, 
            user_name=email.split('@')[0].capitalize().replace('.', '')
        )
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({'message': 'Registration succesful'}), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Unexpected database error during registration: {e}", exc_info=True)
        return jsonify({'message': 'Database error during registration'}), 500

@auth_bp.route("/login", methods=["POST", "GET"])
def login():
    """Handles user login."""
    
    if request.method == "POST":
        data = request.get_json() 
           
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Missing email or password'}), 400
    
        email = data['email']
        password = data['password']
    
        user = User.query.filter_by(email=email).first()
        
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            return jsonify({'message': 'Login successful', 'email': user.email}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401
    
    elif request.method == "GET":
        return jsonify({"message": "Please authenticate via POST"})

@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    """Handles user logout."""
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200

@auth_bp.route("/delete-user", methods=["POST"])
@login_required
def delete_user():
    """Allows a logged-in user to delete their own account."""
    user  = current_user
    if not user:
        return jsonify({"message": f"User {user} not found"}), 400
    
    db.session.delete(user)
    db.session.commit()
    logout_user()
    return jsonify({"message": "Account deleted successfully"}), 200


# --- Password Reset Routes ---

@auth_bp.post('/forgot-password')
def forgot_password():
    """Initiates password reset by sending a link."""
    data = request.get_json()
    email = data.get('email')
    user = User.query.filter_by(email=email).first()

    if user:
        token = user.generate_reset_token()
        
        # SIMULATED EMAIL SENDING (REPLACE WITH REAL EMAIL LOGIC) 📧
        reset_link = f"http://localhost:3000/reset-password?token={token}"
        
        print(f"\n--- PASSWORD RESET TOKEN GENERATED ---")
        print(f"User: {user.email}")
        print(f"Reset Link: {reset_link}")
        print(f"--------------------------------------\n")
    
    db.session.commit()    
    return jsonify({
        'message': 'If the email is registered, a password reset link has been sent.'
    }), 200


@auth_bp.post('/reset-password')
def reset_password():
    """Updates the user's password using the token."""
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({'error': 'Missing token or new password.'}), 400

    # Find the user by token
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or not user.check_reset_token(token):
        return jsonify({'error': 'Invalid, expired, or used token.'}), 400

    # Update the password and clear the token
    user.set_password(new_password) 
    user.clear_reset_token()
    
    db.session.commit()
    
    return jsonify({'message': 'Password successfully reset. You can now log in.'}), 200