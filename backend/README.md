# TENA-AI Backend
This is the Flask backend for Tena AI. It serves public APIs under `/api/*`, persists sessions/messages, and handles AI responses directly through the Flask-native async service.

# Project Structure
backend/
│
├── app/
│   ├── __init__.py       # Flask app creation, register routes
│   ├── routes/
│   │   └── routes.py     # API gateway (chat, right-of-the-day)
│   ├── models.py         # Data handling
│   ├── ai_service.py     # Async Azure OpenAI integration
│   └── prompts.py        # Shared system prompt content
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
# Azure OpenAI
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=deployment_name

# Optional frontend origin override
# FRONTEND_URL=http://localhost:5173,http://localhost:3000
```

5. Run backend

```bash
cd backend
python run.py

# runs Flask backend at http://localhost:5000
```

6. To run React Frontend

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
# Test Flask gateway
Invoke-RestMethod -Uri "http://localhost:5000/api/"


# Test chat endpoint via Flask (PowerShell)
$body = @{ message = "hello" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

Troubleshooting
- CORS: Flask allows `http://localhost:5173` and `http://localhost:3000` and responds to preflight.
- Azure errors: verify `AZURE_OPENAI_*` values and deployment name.
