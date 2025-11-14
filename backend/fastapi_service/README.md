### TENA-AI FastAPI Microservice

This service provides the stateless AI endpoint used by the Flask gateway.

- Public docs: http://localhost:8000/docs
- Health: GET `/health`
- Chat: POST `/ai/chat`

Notes
- Stateless by design: session/history is handled by Flask.
- Rate limiting is optional and disabled by default locally.

Run locally
```
cd backend/fastapi_service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Environment (loaded from backend/.env or backend/backend.env)
```
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Optional internal gateway key (must match Flask)
INTERNAL_API_KEY=some-secret

# Optional rate limiting
# ENABLE_RATE_LIMIT=1
# REDIS_URL=redis://localhost

# Optional DB; defaults to SQLite if unset
# DATABASE_URL=postgresql://user:pass@localhost:5432/tena_ai_db
```

Troubleshooting
- 401 Unauthorized on `/ai/chat`: missing or mismatched `X-Internal-Key` when `INTERNAL_API_KEY` is set.
- Azure errors: verify `AZURE_OPENAI_*` values and deployment name.
- Redis errors: unset `ENABLE_RATE_LIMIT` or start Redis and set `REDIS_URL`.