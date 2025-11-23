import os
import logging
import requests
from typing import Optional, List
from app.models import Message, db 

logger = logging.getLogger(__name__)


def format_messages_for_ai(messages: List[Message]) -> List[dict]:
    """Converts a list of Message SQLAlchemy objects into the OpenAI API format."""
    formatted_history = []
    
    for msg in messages:
        # Renames 'bot' to 'assistant' for OpenAI API compatibility
        role = 'user' if msg.sender == 'user' else 'assistant' 
        formatted_history.append({
            "role": role,
            "content": msg.content
        })
    return formatted_history


def generate_ai_response(message: str, session_id: Optional[str] = None, chat_id: Optional[int] = None) -> Optional[dict]:
    """Retrieves context, forward the full payload to the FastAPI AI.

    Returns a dict with keys: { 'reply': str|null, 'session_id': str|null } or None on failure.
    """
    
    history_payload = []
    
    if chat_id is not None:
        CONTEXT_LIMIT = 10 # last 10 messages
        
        # Query the database using the integer 'chat_id' (the foreign key)
        history_db_objects = db.session.execute(
            db.select(Message)
            .filter_by(chat_id=chat_id) 
            .order_by(Message.timestamp.asc()) 
            .limit(CONTEXT_LIMIT)
        ).scalars().all()

        # Convert SQLAlchemy objects to the API's required dict format
        if history_db_objects:
            history_payload = format_messages_for_ai(history_db_objects)
            
    FLASK_ENV = os.getenv("FLASK_ENV")
    if FLASK_ENV == "development":
        fastapi_url = "http://localhost:8000" 
    elif FLASK_ENV == "production":
        fastapi_url = os.getenv("FASTAPI_URL", "https://tena-fastapi.onrender.com")
    else:
        fastapi_url = "https://tena-fastapi.onrender.com"
            
    endpoint = f"{fastapi_url.rstrip('/')}/ai/chat"
    internal_key = os.getenv("INTERNAL_API_KEY")

    payload = {
        "message": message, 
        "history": history_payload # Include the context
    }
    
    if session_id:
        payload["session_id"] = session_id # Include the UUID for tracking/logging

    headers = {"Content-Type": "application/json"}
    if internal_key:
        headers["X-Internal-Key"] = internal_key

    try:
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return {"reply": data.get("reply"), "session_id": data.get("session_id")}
    except requests.RequestException:
        logger.exception("Failed to call FastAPI AI service at %s", endpoint)
        return None