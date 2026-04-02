import logging
import os
from typing import List, Optional

from openai import AsyncAzureOpenAI

from app.models import Message
from app.prompts import build_system_prompt

logger = logging.getLogger(__name__)

_client: Optional[AsyncAzureOpenAI] = None


def _get_client() -> AsyncAzureOpenAI:
    global _client

    if _client is None:
        _client = AsyncAzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview"),
        )

    return _client


def format_messages_for_ai(messages: List[Message]) -> List[dict]:
    """Converts Message SQLAlchemy objects into the OpenAI chat format."""
    formatted_history = []

    for msg in messages:
        role = "user" if msg.sender == "user" else "assistant"
        formatted_history.append({"role": role, "content": msg.content})

    return formatted_history


def strip_markdown(text: str) -> str:
    """Removes common Markdown characters from a string."""
    text = text.replace("**", "").replace("*", "")
    text = text.replace("#", "").replace("##", "").replace("###", "")
    text = text.replace(">", "").strip()
    return text


async def generate_ai_response(
    message: str,
    session_id: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> Optional[dict]:
    """Generate an AI response directly from the Flask backend."""

    if not message:
        return {"reply": "", "session_id": session_id}

    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    api_key = os.getenv("AZURE_OPENAI_KEY")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

    if not all([api_key, endpoint, deployment]):
        logger.error(
            "Missing Azure OpenAI configuration: api_key=%s, endpoint=%s, deployment=%s",
            bool(api_key),
            bool(endpoint),
            bool(deployment),
        )
        return {"reply": None, "session_id": session_id}

    messages_payload = [{"role": "system", "content": build_system_prompt()}]

    if history:
        messages_payload.extend(history)

    messages_payload.append({"role": "user", "content": message})

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=deployment,
            temperature=0.7,
            max_tokens=400,
            presence_penalty=0.1,
            frequency_penalty=0.1,
            messages=messages_payload,
        )

        reply = (response.choices[0].message.content or "").strip()
        if reply:
            reply = strip_markdown(reply)

        if not reply:
            logger.error("Empty reply from OpenAI")
            return {
                "reply": "I apologize, but I'm having trouble generating a response. Please try again later.",
                "session_id": session_id,
            }

        return {"reply": reply, "session_id": session_id}
    except Exception as exc:
        logger.exception("Error calling OpenAI: %s", str(exc))
        return {
            "reply": "I apologize, but I'm having trouble generating a response. Please try again later.",
            "session_id": session_id,
        }