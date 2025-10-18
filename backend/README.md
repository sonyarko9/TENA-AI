# TENA-AI Backend
This is the Flask backend for Tena AI, a conversational mental wellness assistant. It handles chat requests using Azure OpenAI and serves rights-related content.

Note: We'll complete this once we have the complete frontend code
create a fronted/ folder an put all you React code in there, then I'll take it up from there.

# Project Structure
backend/
│
├── app/
│   ├── __init__.py       # Flask app creation, register routes
│   ├── routes.py         # API endpoints (chat, right-of-the-day)
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