# TENA-AI Integration Guide (React + Flask)

This document explains how the frontend and backend were integrated, the problems encountered, how they were resolved, and the final configuration required to run everything locally.

## High-level Architecture

- Frontend (React/Vite): User interface, calls the Flask backend only.
- Flask (port 5000): Public API under `/api/*`. Persists sessions/messages, applies CORS, and generates AI replies directly.

Request flow: React → Flask (`/api/chat`) → OpenAI → Flask → React.

## Key Code Locations

- Frontend API service: `frontend/src/services/api.js` (points to `http://localhost:5000/api`)
- Frontend Chat UI: `frontend/src/components/ChatPage.jsx`
- Flask app setup (CORS, blueprint): `backend/app/__init__.py`
- Flask routes (chat, preflight): `backend/app/routes/routes.py`
- Flask AI service: `backend/app/ai_service.py`

## Changes Made to Integrate

### Frontend
- Updated `frontend/src/services/api.js` to call Flask: `http://localhost:5000/api/chat`.
- Fixed `ChatPage.jsx` `handleNewChat` to be `async` to allow `await`.

### Flask
- CORS: Configured to allow `http://localhost:5173` and `http://localhost:3000` and to respond to preflight requests.
- Added explicit preflight route for `OPTIONS /api/chat` and ensured headers are set via `after_request`.
- Gateway logic persists user and bot messages, then calls the async Flask AI service directly.

### Dependencies
- Pinned versions to avoid resolver conflicts and HTTP client incompatibilities:
  - `backend/requirements.txt`: Flask, Flask-CORS, SQLAlchemy, Flask-SQLAlchemy, OpenAI 2.6.1, httpx 0.27.2, asgiref.

## Issues Encountered and Resolutions

1) Vite build error: "await can only be used inside an async function"
- Cause: `handleNewChat` used `await` without `async`.
- Fix: Marked function as `async`.

2) OpenAI SDK deprecation / httpx proxies error
- Symptoms: `Client.__init__() got an unexpected keyword argument 'proxies'` and older `openai.ChatCompletion` usage.
- Fix: Upgraded to OpenAI SDK 2.6.1 and pinned `httpx==0.27.2`, switched to `AsyncAzureOpenAI` client.

3) CORS preflight failing
- Cause: Origin mismatch and insufficient preflight handling.
- Fix: Allowed `http://localhost:5173` and `http://localhost:3000`, added global CORS and `after_request` CORS headers, plus explicit `OPTIONS /api/chat`.

4) `.env` parse warnings
- Cause: Invalid formatting in env file.
- Fix: Cleaned to `KEY=VALUE` per line; comments start with `#`.

## Final Environment Setup

Use a single env file in `backend/` (`.env`). Example:

```
# Azure OpenAI
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Database
# DATABASE_URL=postgresql://user:password@localhost:5432/tena_ai_db

# CORS (optional; Flask defaults allow localhost:5173 and 3000)
# FRONTEND_URL=http://localhost:5173,http://localhost:3000
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

2) Frontend (Vite)
```
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173`.

## Sanity Checks

- Preflight/CORS:
  - OPTIONS to `http://localhost:5000/api/chat` returns 204 and includes `Access-Control-Allow-Origin` with your dev origin.
- End-to-end: Sending a message in the UI returns an AI-generated reply.

## Troubleshooting

- Always check logs:
  - Flask console for CORS or Azure config errors.
- If you see fallbacks (generic apology messages):
  - Validate Azure env vars and deployment name.
- If `.env` warnings appear:
  - Ensure `KEY=VALUE` per line, no stray characters. Comments use `#`.

---

With these changes, the app runs end-to-end locally as a single Flask backend with async AI handling, robust CORS support, and modern Azure OpenAI integration.
