from typing import Optional
import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from openai import AzureOpenAI
from redis.asyncio import Redis
from fastapi import FastAPI, Request
from fastapi import Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from pydantic import BaseModel
from database import engine, Base
import models

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# database tables
Base.metadata.create_all(bind=engine)

# Rate limit settings
RATE_LIMIT_MINUTE = int(os.getenv("RATE_LIMIT_MINUTE", "60"))  # requests per minute
RATE_LIMIT_HOUR = int(os.getenv("RATE_LIMIT_HOUR", "1000"))   # requests per hour
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")
ENABLE_RATE_LIMIT = os.getenv("ENABLE_RATE_LIMIT", "0") == "1"

app = FastAPI(title="Tena AI - AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load env from backend directory 
_backend_dir = Path(__file__).resolve().parents[1]
load_dotenv(_backend_dir / ".env")

# Azure OpenAI client (support both env names)
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_API_KEY") or os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT") or os.getenv("AZURE_OPENAI_BASE")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=AZURE_OPENAI_API_VERSION,
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    """Initialize optional rate limiter on startup"""
    if ENABLE_RATE_LIMIT:
        try:
            redis = Redis.from_url(REDIS_URL, encoding="utf-8", decode_responses=True)
            await FastAPILimiter.init(redis)
            logger.info("Rate limiting enabled with Redis at %s", REDIS_URL)
        except Exception as exc:
            logger.warning("Rate limiter disabled: Redis init failed: %s", exc)
    else:
        logger.info("Rate limiting disabled (ENABLE_RATE_LIMIT != 1)")

@app.on_event("shutdown")
async def shutdown():
    """Close Redis connection if limiter was initialized"""
    try:
        await FastAPILimiter.close()
    except Exception:
        pass

if ENABLE_RATE_LIMIT:
    rate_limit_dependency = Depends(RateLimiter(times=RATE_LIMIT_MINUTE, minutes=1))
else:
    async def _noop_rate_limit():
        return True
    rate_limit_dependency = Depends(_noop_rate_limit)


@app.post("/ai/chat")
async def ai_chat(
    req: ChatRequest,
    x_internal_key: Optional[str] = Header(None),
    rate_limit: bool = rate_limit_dependency):
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
        # Blocking call to Azure OpenAI SDK executed in a thread
        resp = client.chat.completions.create(
            model=deployment,  # Azure deployment name
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
        return (resp.choices[0].message.content or "").strip()

    try:
        # Check required Azure settings
        if not all([AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, deployment]):
            logger.error("Missing Azure OpenAI configuration: api_key=%s, api_base=%s, deployment=%s",
                        bool(AZURE_OPENAI_KEY), bool(AZURE_OPENAI_ENDPOINT), bool(deployment))
            raise ValueError("Azure OpenAI configuration incomplete")
        
        reply = await asyncio.to_thread(_call_openai)
        if not reply:
            logger.error("Empty reply from OpenAI")
            return {"reply": "I apologize, but I'm having trouble generating a response. Please, try again later.", "session_id": req.session_id}
        return {"reply": reply, "session_id": req.session_id}
    except Exception as e:
        logger.exception("Error calling OpenAI: %s", str(e))
        return {"reply": "I apologize, but I'm having trouble generating a response. Please, try again later.", "session_id": req.session_id}

    return {"reply": reply, "session_id": req.session_id}
