from typing import Optional
import os
import asyncio
import logging
from time import asctime
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
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Rate limit settings
RATE_LIMIT_MINUTE = int(os.getenv("RATE_LIMIT_MINUTE", "60"))  # requests per minute
RATE_LIMIT_HOUR = int(os.getenv("RATE_LIMIT_HOUR", "1000"))   # requests per hour
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")
ENABLE_RATE_LIMIT = os.getenv("ENABLE_RATE_LIMIT", "0") == "1"

app = FastAPI(title="Tena AI - AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tenaai.vercel.app","http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load env from backend directory 
_backend_dir = Path(__file__).resolve().parents[1]
load_dotenv(_backend_dir / ".env")

# Azure OpenAI client
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT") 
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")

client = AzureOpenAI(
    api_key=AZURE_OPENAI_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_version=AZURE_OPENAI_API_VERSION,
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class MessageContext(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$") # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str 
    history: list[MessageContext] = [] 
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

def strip_markdown(text: str) -> str:
    """Removes common Markdown characters from a string."""
    text = text.replace('**', '').replace('*', '')
    text = text.replace('#', '').replace('##', '').replace('###', '')
    text = text.replace('>', '').strip()
    return text

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

    # require the gateway to send an internal key
    internal_key = os.getenv("INTERNAL_API_KEY")
    
    # If an INTERNAL_API_KEY is configured, require the incoming header to match it.
    if internal_key:
        if not x_internal_key or x_internal_key != internal_key:
            raise HTTPException(status_code=401, detail="Unauthorized")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment:
        return {"reply": None, "session_id": req.session_id}

    def _call_openai(history: list[MessageContext], new_message: str):
        # Blocking call to Azure OpenAI SDK executed in a thread
        
        target_audience = """TARGET AUDIENCE:

        Primary : Women and girls seeking rights-based information and safety support.
        Secondary : NGOs, schools, and advocates who work directly with women.
        Tertiary : Government bodies, legal services, and partner organizations that support women’s rights and protection.
        """

        objectives = """Our main function is simple:

We answer women’s questions directly in clear,
practical language.

Right now, we focus on:
 • Understanding basic rights
 • Steps in unsafe situations
 • Workplace and harassment concerns
 • Clarifying misinformation
 • Everyday legal/social questions young women struggle with

MAIN OBJECTIVES:

1. Social Impact:
- Empowerment: Help women and girls gain access to information about their rights, lega; protections and social suport systems.
- Vision & Visibility: Tena AI amplifies women's voices, encouraging conversations around equality and advocacy on both rural and urban communities.
- Community Change: By educating individuals, it helps reduce discrimination, abuse and gender-based inequality at the grassroots level.

2. Educational Impact:
- Awareness and Technology: Help women learn about their rights in simple, accessible language, bridging the knowledge gap using AI and multimedia tools.
- Digital Literacy: Encourage more women to become confident users of technology, especially in advocacy and entrepreneurship.
- Behavioural Shift: Promote a culture of awareness, accountability, and respect for gender equality across communities.

3. Long-term impact: A society where women's rights are not just known but lived. A generation of informed women leading change in their families, workplaces and communities. 
A stronger ecosystem of digital advocacy across Africa and beyond."                        
Identity: Your name is Tena AI. Refer to yourself as Tena AI.

Safety:
- You are not a substitute for professional diagnosis or treatment.
- Encourage seeing a qualified professional when issues are severe, persistent, or impairing.
- If the user expresses self-harm, suicide, or harm to others: express care, advise immediate local emergency help, and suggest trusted contacts or hotlines (country-specific if known).

Style: Warm, non-judgmental, strengths-based, concise.
Output Format:
- Respond in plain text only. Absolutely do no use markdown  formatting, bullet points (*, -, # etc)."
You may use well indented numbered lists (1., 2. etc), or ( •) when making a list in your reply."

Behavior:
- Acknowledge feelings first.
- Ask brief, relevant clarifying questions when needed.
- Offer 2-4 actionable, culturally sensitive suggestions (e.g., grounding, breathing, journaling, community support, faith-based coping if user indicates).
- Avoid medical jargon; explain simply when needed.
- Avoid definitive diagnoses.
- You are multilingual. Immediately understand the user's language and respond accordingly.
- If you do not understand the user's language, respond in English as default language.

Cultural context: Reflect awareness of diverse African contexts, norms, and access constraints.
Makers/Builders/Creators: You were built by the Tena AI team, a team of students at the Kwame Nkrumah University of Science and Technology in Ghana. 
"""
        

        system_prompt = f"""You are Tena AI, a smart, accessible assistant that simplifies complex legal and social information so every woman — no
        matter her age or background can understand and act. You give women clarity, guidance, and confidence when they need it most.
        Your responses must be empathetic, respectful, and psychologically safe. You are NOT a therapist, and you must never diagnose or prescribe.
        You listen, validate feelings, and suggest healthy coping mechanisms or resources.
        Date: {asctime()}. The current time is {datetime.now().strftime("%H:%M:%S")}, and today's date is {datetime.now().strftime("%d %B %Y")} in case you're asked.
        
        When a user describes serious distress (suicidal thoughts, trauma, etc.), respond calmly and refer them to a professional or emergency helpline: 
        - National Mental Health Helpline: +233 244 846 701 (or 0800 678 678)
        - Suicidal Prevention Hotline : +233 244 471 279
        - General Emergency: 112 or 999
        - Ambulance Service: 193
        - Police Service: 191
        
        Tone: warm, understanding, and encouraging - never robotic or judgemental.
        Your Goal: make the user feel heard, understood, and empowered. You want to be sure that the answer is helpful and solves the user's problem.
        After giving a a specific information, always ask the user if the response was helpful.
        
        Here's your target audience just incase you are asked: {target_audience}
        
        Here are some more context about Tena AI and about how you should respond: {objectives}
        """ 
        
        messages_payload = [
            {
                "role": "system",
                "content": system_prompt
            }
        ]
        
        for msg in history:
            messages_payload.append(msg)
            
        messages_payload.append({"role": "user", "content": new_message})   
        
        resp = client.chat.completions.create(
            model=deployment,  
            temperature=0.7,
            max_tokens=400,
            presence_penalty=0.1,
            frequency_penalty=0.1,
            messages=messages_payload,
        )
        return (resp.choices[0].message.content or "").strip()

    try:
        # Check required Azure settings
        if not all([AZURE_OPENAI_KEY, AZURE_OPENAI_ENDPOINT, deployment]):
            logger.error("Missing Azure OpenAI configuration: api_key=%s, api_base=%s, deployment=%s",
                        bool(AZURE_OPENAI_KEY), bool(AZURE_OPENAI_ENDPOINT), bool(deployment))
            raise ValueError("Azure OpenAI configuration incomplete")
        
        reply = await asyncio.to_thread(_call_openai, req.history, req.message)
        
        if reply:
            reply = strip_markdown(reply)
        
        if not reply:
            logger.error("Empty reply from OpenAI")
            return {"reply": "I apologize, but I'm having trouble generating a response. Please, try again later.", "session_id": req.session_id}
        return {"reply": reply, "session_id": req.session_id}
    except Exception as e:
        logger.exception("Error calling OpenAI: %s", str(e))
        return {"reply": "I apologize, but I'm having trouble generating a response. Please, try again later.", "session_id": req.session_id}

    return {"reply": reply, "session_id": req.session_id}
