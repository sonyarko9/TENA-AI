# TENA-AI Backend
This is the Flask gateway backend for Tena AI. It serves public APIs under `/api/*`, persists sessions/messages, and forwards AI requests to the FastAPI microservice. The FastAPI service is async-first for performance.

# Project Structure
backend/
│
├── fastapi_service/
│   └── main.py           # FastAPI microservice (stateless AI service) for async AI handling 
|
├── app/
│   ├── __init__.py       # Flask app creation, register routes
│   ├── routes.py         # API gateway (chat, right-of-the-day)
│   ├── models.py         # Data handling
│   └── services.py       # Azure OpenAI integration
│
├── data/
│   └── rights_data.json  # Rights info & FAQs
├── config.py             # Configuration & environment variables
├── requirements.txt      # Python dependencies
└── run.py                # Entry point to start the app


# Setup & Run

1. Update local repo

```bash
git pull origin main
```

2. Create virtual environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. Set environment variables (create a `.env` in `backend/`)

```bash
FASTAPI_URL=http://localhost:8000

# Optional internal key (must match FastAPI if set)
# INTERNAL_API_KEY=some-secret

# Azure OpenAI (used by FastAPI, but kept here for shared config)
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=deployment_name
```

5. Run backend

```bash
cd backend
python run.py

# runs Flask backend at http://localhost:5000
```

6. To run Uvicorn server for FastAPI

```bash
# Go to the fastapi_service directory first
cd backend/fastapi_service

# Start uvicorn pointing to the FastAPI app
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# runs FastAPI at http://localhost:8000
```

7. To run React Frontend

```bash
cd frontend
npm install
npm run dev
# starts Vite dev server at http://localhost:5173
```

Optional: create PostgreSQL database

```bash
psql -U postsgres
```

Then in PostgreSQL prompt:

```bash
CREATE DATABASE tena_ai_db;
CREATE USER tena WITH PASSWORD 'tena_password';
GRANT ALL PRIVILEGES ON DATABASE tena_ai_db TO tena;
```

To test connections

```bash
# Test FastAPI health
Invoke-RestMethod -Uri "http://localhost:8000/health"

# Test Flask gateway
Invoke-RestMethod -Uri "http://localhost:5000/api/"


# Test chat endpoint via Flask (PowerShell)
$body = @{ message = "hello" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

Troubleshooting
- CORS: Flask allows `http://localhost:5173` and `http://localhost:3000` and responds to preflight.
- 404 from FastAPI: ensure `POST /ai/chat` exists at `http://localhost:8000/docs` and you’re running `main:app`.
- 401 from FastAPI: set matching `INTERNAL_API_KEY` in `backend/.env` or unset it in both.
- Azure errors: verify `AZURE_OPENAI_*` values and deployment name.


```bash
git pull origin main
```
