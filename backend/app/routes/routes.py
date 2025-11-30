from flask import Blueprint, request, jsonify, current_app
from app.services import generate_ai_response
from app.models import Message, ChatSession, db
from flask_login import current_user, login_required
from datetime import datetime
import json
import os
import uuid

main_bp = Blueprint("api", __name__)

# Load rights data from the repository's data folder 
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
data_file = os.path.join(base_dir, "data", "rights_data.json")
try:
    with open(data_file, "r", encoding="utf-8") as f:
        rights_data = json.load(f)
except Exception:
    rights_data = {"rights": [], "faqs": []}

@main_bp.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed = {"https://tenaai.vercel.app","http://localhost:5173", "http://localhost:3000"}
    if origin in allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@main_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to Tena AI Backend!"})

@main_bp.route("/health", methods=["GET", "OPTIONS"])
def health_check():
    if request.method == "OPTIONS":
        return "Flask is working", 200
    
    return jsonify({
        "status": "Backend working perfectly!", 
        "service": "Flask API",
        "timestamp": datetime.utcnow().isoformat()
    }), 200

@main_bp.route("/right-of-the-day", methods=["GET"])
def right_of_the_day():
    # Return first right (can randomize later)
    if rights_data.get("rights"):
        return jsonify(rights_data["rights"][0])
    return jsonify({}), 404

@main_bp.route("/chat", methods=["OPTIONS"])
def chat_preflight():
    return ("", 204)


@main_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Accept or create a session id so frontend can continue conversations
    session_uuid = data.get("session_id") or uuid.uuid4().hex

    # Ensure a ChatSession exists
    chat_session = ChatSession.query.filter_by(session_uuid=session_uuid).first()
    if not chat_session:
        user_id_to_assign = None
        if current_user.is_authenticated:
            user_id_to_assign = current_user.user_id
            
        chat_session = ChatSession(
            session_uuid=session_uuid,
            user_id=user_id_to_assign
        )
        db.session.add(chat_session)
        db.session.commit()
    
    current_chat_id = chat_session.chat_id
    
    # AI response (forward to FastAPI microservice)
    ai_result = generate_ai_response(user_message, session_id=session_uuid, chat_id=current_chat_id)
    
    if not ai_result:
        reply = "Sorry, I'm having trouble right now. Please try again later."
    else:
        reply = ai_result.get("reply", "An unknown response was received") 
    
    returned_session = ai_result.get("session_id") or session_uuid

    # Persist user message
    user_msg = Message(chat_id=current_chat_id, sender="user", content=user_message)
    db.session.add(user_msg)
    
    # Persist bot message
    bot_msg = Message(chat_id=current_chat_id, sender="bot", content=reply)
    db.session.add(bot_msg)
    
    db.session.commit() 

    return jsonify({"reply": reply, "session_id": returned_session})


@main_bp.get("/chat/history")
@login_required
def get_history():
    """
    Fetches the list of chat sessions for the currently logged-in user.
    """
    if not current_user.is_authenticated:
        return jsonify({"message": "Unauthorized"}), 401

    try:
        # Query all ChatSessions belonging to the current user, ordered by creation time
        sessions = ChatSession.query.filter_by(
            user_id=current_user.user_id
        ).order_by(
            ChatSession.created_at.desc() 
        ).all()
        
        history_list = []
        for session in sessions:
            
            # For the title, grab the first user message of the session
            first_user_message = Message.query.filter_by(
                chat_id=session.chat_id,
                sender='user'
            ).order_by(Message.timestamp.asc()).first()

            # Determine the session title and date
            session_title = first_user_message.content[:50] if first_user_message else "New Conversation"
            session_date = session.created_at.strftime('%Y-%m-%d')
            
            history_list.append({
                "chat_id": session.chat_id,
                "session_id": session.session_uuid,
                "title": session_title,
                "date": session_date
            })

        return jsonify(history_list), 200

    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return jsonify({"message": "An error occurred while retrieving history."}), 500    
 
 
@main_bp.get("/chat/rename-title")  
@login_required
def rename_chat_title():
    return


@main_bp.get("/chat/messages/<session_uuid>")  
@login_required
def get_messages(session_uuid):
    """
    Fetches messages for a specific session ID, verified against the current user.
    """
    # Find the session and ensure it belongs to the current user
    session = ChatSession.query.filter_by(
        session_uuid=session_uuid,
        user_id=current_user.user_id
    ).first()
    
    if not session:
        return jsonify({"message": "Session not found or access denied"}), 404

    # Fetch all messages in the session, ordered by timestamp
    messages = Message.query.filter_by(
        chat_id=session.chat_id
    ).order_by(Message.timestamp.asc()).all()
    
    message_list = []
    for message in messages:
        message_list.append({
            "id": str(message.message_id),
            "text": message.content,
            "sender": message.sender,
            "timestamp": message.timestamp.strftime('%H:%M') # Format time for display
        })

    return jsonify({"messages": message_list}), 200


@main_bp.post('/user/settings')
@login_required     
def user_settings():
    return