from typing import Optional
import os
import asyncio
import logging
from datetime import datetime
import openai
import aioredis
from fastapi import FastAPI, Request
from fastapi import Header, HTTPException, Depends
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel
from database import engine, Base
import models

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Create database tables
Base.metadata.create_all(bind=engine)

# Rate limit settings
RATE_LIMIT_MINUTE = int(os.getenv("RATE_LIMIT_MINUTE", "60"))  # requests per minute
RATE_LIMIT_HOUR = int(os.getenv("RATE_LIMIT_HOUR", "1000"))   # requests per hour
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")

app = FastAPI(title="Tena AI - AI Service")

openai.api_type = "azure"
openai.api_key = os.getenv("AZURE_OPENAI_KEY")
openai.api_base = os.getenv("AZURE_OPENAI_ENDPOINT")
openai.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2023-07-01-preview")


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    """Initialize rate limiter on startup"""
    redis = await aioredis.create_redis_pool(REDIS_URL)
    await FastAPILimiter.init(redis)

@app.on_event("shutdown")
async def shutdown():
    """Close Redis connection"""
    await FastAPILimiter.close()

@app.post("/ai/chat")
async def ai_chat(
    req: ChatRequest,
    x_internal_key: Optional[str] = Header(None),
    rate_limit: bool = Depends(
        RateLimiter(
            times=RATE_LIMIT_MINUTE,
            minutes=1,
            key_func=lambda _: "global"  # Global rate limit across all users
        )
    )):
    """Accepts a chat request and returns a generated reply.

    This endpoint is intentionally stateless: session handling and persistence
    are expected to be performed by the gateway (Flask) or another service.
    """
    if not req.message:
        return {"reply": "", "session_id": req.session_id}

    # Simple internal auth: require the gateway to send an internal key
    internal_key = os.getenv("INTERNAL_API_KEY")
    
    # If an INTERNAL_API_KEY is configured, require the incoming header to match it.
    if internal_key:
        if not x_internal_key or x_internal_key != internal_key:
            raise HTTPException(status_code=401, detail="Unauthorized")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        return {"reply": None, "session_id": req.session_id}

    def _call_openai():
        # Blocking call to OpenAI SDK executed in a thread
        resp = openai.ChatCompletion.create(
            engine=deployment,
            max_tokens=150,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful, empathetic AI assistant. Provide accurate, culturally "
                        "aware guidance about women's rights and support users respectfully."
                    ),
                },
                {"role": "user", "content": req.message},
            ],
        )
        return resp.choices[0].message.content.strip()

    try:
        # Check required Azure settings
        if not all([openai.api_key, openai.api_base, deployment]):
            logger.error("Missing Azure OpenAI configuration: api_key=%s, api_base=%s, deployment=%s",
                        bool(openai.api_key), bool(openai.api_base), bool(deployment))
            raise ValueError("Azure OpenAI configuration incomplete")
        
        reply = await asyncio.to_thread(_call_openai)
        if not reply:
            logger.error("Empty reply from OpenAI")
            return {"reply": "I apologize, but I'm having trouble generating a response.", "session_id": req.session_id}
        return {"reply": reply, "session_id": req.session_id}
    except Exception as e:
        logger.exception("Error calling OpenAI: %s", str(e))
        return {"reply": "I apologize, but I'm having trouble generating a response.", "session_id": req.session_id}

    return {"reply": reply, "session_id": req.session_id}
