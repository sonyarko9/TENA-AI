from flask import Blueprint, request, jsonify, current_app
from app.services import generate_ai_response
from .models import User, Message, ChatSession, db
import json
import os
import uuid

main_bp = Blueprint("api", __name__)

@main_bp.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    allowed = {"http://localhost:5173", "http://localhost:3000"}
    if origin in allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        # default dev origin
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Vary"] = "Origin"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# Load rights data from the repository's data folder 
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
data_file = os.path.join(base_dir, "data", "rights_data.json")
try:
    with open(data_file, "r", encoding="utf-8") as f:
        rights_data = json.load(f)
except Exception:
    rights_data = {"rights": [], "faqs": []}


@main_bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to Tena AI Backend!"})


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
    session_id = data.get("session_id") or uuid.uuid4().hex

    # Ensure a ChatSession exists
    chat_session = ChatSession.query.filter_by(session_id=session_id).first()
    if not chat_session:
        chat_session = ChatSession(session_id=session_id)
        db.session.add(chat_session)
        db.session.commit()

    # Persist user message
    user_msg = Message(session_id=session_id, sender="user", content=user_message)
    db.session.add(user_msg)
    db.session.commit()

    # AI response (forward to FastAPI microservice)
    ai_result = generate_ai_response(user_message, session_id=session_id)
    if not ai_result:
        reply = "Sorry, I'm having trouble right now. Please try again later."
        returned_session = session_id
    else:
        reply = ai_result.get("reply") or ""
        returned_session = ai_result.get("session_id") or session_id

    bot_msg = Message(session_id=returned_session, sender="bot", content=reply)
    db.session.add(bot_msg)
    db.session.commit()

    return jsonify({"reply": reply, "session_id": returned_session})


@main_bp.route("/right-of-the-day", methods=["GET"])
def right_of_the_day():
    # Return first right (can randomize later)
    if rights_data.get("rights"):
        return jsonify(rights_data["rights"][0])
    return jsonify({}), 404


@main_bp.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.user_id, "name": u.user_name} for u in users])