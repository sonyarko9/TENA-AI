import os
import logging
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def generate_ai_response(message: str, session_id: Optional[str] = None) -> Optional[dict]:
    """Forward the message and optional session_id to the FastAPI AI microservice.

    Returns a dict with keys: { 'reply': str|null, 'session_id': str|null } or None on failure.
    """
    FLASK_ENV = os.getenv("FLASK_ENV")
    if FLASK_ENV == "development":
        fastapi_url = "http://localhost:8000" 
    elif FLASK_ENV == "production":
        fastapi_url = os.getenv("FASTAPI_URL", "https://tena-fastapi.onrender.com")
    else:
        fastapi_url = "https://tena-fastapi.onrender.com"
            
    endpoint = f"{fastapi_url.rstrip('/')}/ai/chat"
    internal_key = os.getenv("INTERNAL_API_KEY")

    payload = {"message": message}
    if session_id:
        payload["session_id"] = session_id

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
