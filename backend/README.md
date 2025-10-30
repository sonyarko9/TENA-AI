# TENA-AI Backend
This is the Flask backend for Tena AI, a conversational mental wellness assistant. It handles chat requests using Azure OpenAI and serves rights-related content.

Note: We'll complete this once we have the complete frontend code
create a fronted/ folder an put all you React code in there, then I'll take it up from there.

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
pip instal -r requirements.txt
```

4. Set environment variables (create a .env file in backend/)

```bash
SECRET_KEY=your_secret_key
FLASK_ENV=development
AZURE_OPENAI_KEY=azure_api_key
AZURE_OPENAI_ENDPOINT=azure_endpoint
AZURE_OPENAI_DEPLOYMENT=deployment_name
```

5. Run backend

```bash
python run.py
```

6. To run Uvicorn server for FastAPI

```bash
# Go to the fastapi_service directory first
cd fastapi_service

# Start uvicorn pointing to the FastAPI app
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

TO create PostgreSQL database

```bash
psql -U postsgres
```

Then in POstgreSQL prompt:

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


# Test chat endpoint via Flask
$body = @{
    message = "hello"
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```


```bash
git pull origin main
```
