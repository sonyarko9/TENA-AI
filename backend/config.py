import os
from dotenv import load_dotenv, find_dotenv

# Load environment from the nearest .env (prefer repo root)
load_dotenv(find_dotenv())

class Config:
   SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
   SQLALCHEMY_TRACK_MODIFICATIONS = False
   SECRET_KEY = os.getenv("SECRET_KEY")
   FLASK_ENV = os.getenv("FLASK_ENV", "development")
   AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
   AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
   AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
   # frontend origin for CORS (set to '*' for dev)
   FRONTEND_URL = os.getenv("https://tenaai.vercel.app", "FRONTEND_URL",  "http://localhost:5173")
   FASTAPI_URL = os.getenv("https://tena-fastapi.onrender.com", "FASTAPI_URL",  "http://localhost:8000")