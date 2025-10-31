# TENA-AI Integration Guide (React + Flask + FastAPI)

This document explains how the frontend and backend were integrated, the problems encountered, how they were resolved, and the final configuration required to run everything locally.

## High-level Architecture

- Frontend (React/Vite): User interface, calls the Flask backend only.
- Flask (Gateway, port 5000): Public API under `/api/*`. Persists sessions/messages, applies CORS, forwards AI calls to FastAPI.
- FastAPI (AI microservice, port 8000): Stateless AI endpoint under `/ai/chat`. Calls Azure OpenAI and returns a reply.

Request flow: React → Flask (`/api/chat`) → FastAPI (`/ai/chat`) → Flask → React.

## Key Code Locations

- Frontend API service: `frontend/src/services/api.js` (points to `http://localhost:5000/api`)
- Frontend Chat UI: `frontend/src/components/ChatPage.jsx`
- Flask app setup (CORS, blueprint): `backend/app/__init__.py`
- Flask routes (chat, preflight): `backend/app/routes.py`
- Flask → FastAPI forwarder: `backend/app/services.py`
- FastAPI app and AI logic: `backend/fastapi_service/main.py`
- FastAPI DB config (default SQLite for local): `backend/fastapi_service/database.py`

## Changes Made to Integrate

### Frontend
- Updated `frontend/src/services/api.js` to call Flask: `http://localhost:5000/api/chat`.
- Fixed `ChatPage.jsx` `handleNewChat` to be `async` to allow `await`.

### Flask
- CORS: Configured to allow `http://localhost:5173` and `http://localhost:3000` and to respond to preflight requests.
- Added explicit preflight route for `OPTIONS /api/chat` and ensured headers are set via `after_request`.
- Gateway logic persists user and bot messages, forwards to FastAPI using `generate_ai_response`.

### FastAPI
- Replaced deprecated OpenAI usage with Azure SDK v1.x (`AzureOpenAI`).
- Made rate limiting optional (no Redis needed locally). Controlled via `ENABLE_RATE_LIMIT`.
- Switched `aioredis` to `redis.asyncio` and allowed disabling limiter to avoid Redis dependency locally.
- Defaulted DB to SQLite when `DATABASE_URL` is not set (avoids Docker-only hostname `db`).
- Loads env from the backend directory (`backend/.env` or `backend/backend.env`).

### Dependencies
- Pinned versions to avoid resolver conflicts and HTTP client incompatibilities:
  - `backend/requirements.txt` (Flask-side): Flask, Flask-CORS, SQLAlchemy, Flask-SQLAlchemy, Requests, OpenAI 2.6.1, httpx 0.27.2.
  - `backend/fastapi_service/requirements.txt` (FastAPI-side): FastAPI 0.120.2, Uvicorn 0.38.0, Pydantic 2.12.3, OpenAI 2.6.1, httpx 0.27.2, redis 4.5.5, fastapi-limiter 0.1.6, SQLAlchemy, Alembic, psycopg2-binary.

## Issues Encountered and Resolutions

1) Vite build error: "await can only be used inside an async function"
- Cause: `handleNewChat` used `await` without `async`.
- Fix: Marked function as `async`.

2) FastAPI install conflicts (redis vs fastapi-limiter) and PyPI timeouts
- Cause: `fastapi-limiter` < 0.1.6 requires redis < 5.0.0. We pinned redis to 4.5.5 and limiter to 0.1.6.
- Fix: Updated `backend/fastapi_service/requirements.txt` to compatible pins.

3) `aioredis` import and Redis requirement
- Cause: Using `aioredis` and enforcing Redis on startup.
- Fix: Switched to `redis.asyncio` and made rate limiting optional via `ENABLE_RATE_LIMIT`.

4) Database connection to host `db` (Docker-only) failing locally
- Cause: `DATABASE_URL` defaulted to Postgres at host `db`.
- Fix: Default to SQLite at `backend/instance/tena_ai.db` if `DATABASE_URL` is not set.

5) OpenAI SDK deprecation / httpx proxies error
- Symptoms: `Client.__init__() got an unexpected keyword argument 'proxies'` and older `openai.ChatCompletion` usage.
- Fix: Upgraded to OpenAI SDK 2.6.1 and pinned `httpx==0.27.2`, switched to `AzureOpenAI` client.

6) Azure API key env var typo
- Cause: Read `AZURE_OPENAI__KEY` (double underscore) instead of `AZURE_OPENAI_KEY`.
- Fix: Corrected env var name and allowed either `AZURE_OPENAI_API_KEY` or `AZURE_OPENAI_KEY`.

7) CORS preflight failing
- Cause: Origin mismatch and insufficient preflight handling.
- Fix: Allowed `http://localhost:5173` and `http://localhost:3000`, added global CORS and `after_request` CORS headers, plus explicit `OPTIONS /api/chat`.

8) 401 Unauthorized from FastAPI `/ai/chat`
- Cause: `INTERNAL_API_KEY` required by FastAPI, but Flask didn’t send it due to env parse errors or mismatch.
- Fix: Standardized on backend env file; ensured both Flask and FastAPI read the same `INTERNAL_API_KEY`. Alternatively, removed the key during local dev.

9) `.env` parse warnings
- Cause: Invalid formatting in env file.
- Fix: Cleaned to `KEY=VALUE` per line; comments start with `#`.

## Final Environment Setup

Use a single env file in `backend/` (either `.env` or `backend.env`). Example:

```
# Flask ↔ FastAPI
FASTAPI_URL=http://localhost:8000
INTERNAL_API_KEY=some-secret   # optional; must match in both

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Database (optional; defaults to SQLite if unset in FastAPI)
# DATABASE_URL=postgresql://user:password@localhost:5432/tena_ai_db

# CORS (optional; Flask defaults allow localhost:5173 and 3000)
# FRONTEND_URL=http://localhost:5173,http://localhost:3000

# Rate limiting (optional; FastAPI)
# ENABLE_RATE_LIMIT=1
# REDIS_URL=redis://localhost
```

## How to Run Locally

1) Backend (Flask)
```
cd backend
python -m venv venv
./venv/Scripts/activate  # Windows
pip install --upgrade pip
pip install -r requirements.txt
python run.py
```
- Runs at `http://localhost:5000`.

2) FastAPI (AI service)
```
cd backend/fastapi_service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- Runs at `http://localhost:8000`.
- Docs: `http://localhost:8000/docs`

3) Frontend (Vite)
```
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173`.

## Sanity Checks

- Preflight/CORS:
  - OPTIONS to `http://localhost:5000/api/chat` returns 204 and includes `Access-Control-Allow-Origin` with your dev origin.
- FastAPI health: `GET http://localhost:8000/health` → `{ "status": "ok" }`.
- FastAPI AI:
  - If internal key enabled: `POST /ai/chat` with `X-Internal-Key: some-secret` and JSON `{ "message": "hello" }` should return 200.
- End-to-end: Sending a message in the UI returns an AI-generated reply.

## Troubleshooting

- Always check logs:
  - Flask console for CORS, 401, or FastAPI call failures.
  - FastAPI console for Azure config errors, 401 (internal key), Redis warnings.
- If you see fallbacks (generic apology messages):
  - Ensure FastAPI `/ai/chat` returns 200 for your test input.
  - Validate Azure env vars and deployment name.
  - Remove or match `INTERNAL_API_KEY` across both servers.
- If `.env` warnings appear:
  - Ensure `KEY=VALUE` per line, no stray characters. Comments use `#`.

---

With these changes, the app runs end-to-end locally with clear separation of concerns, robust CORS handling, and modern Azure OpenAI integrations.
