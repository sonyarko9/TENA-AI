from flask import Blueprint, request, jsonify
from app.services import ask_azure_openai
import json
import os

bp = Blueprint("api", __name__)

# Load rights data
data_file = os.path.join("data", "rights_data.json")
with open(data_file, "r", encoding="utf-8") as f:
    rights_data = json.load(f)

@bp.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to Tena AI Backend!"})

@bp.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    if not user_message:
        return jsonify({"error": "Message required"}), 400

    # Placeholder AI response
    response = ask_azure_openai(user_message)
    return jsonify({"reply": response})

@bp.route("/right-of-the-day", methods=["GET"])
def right_of_the_day():
    # For MVP: always return first right (can randomize later)
    return jsonify(rights_data["rights"][0])
