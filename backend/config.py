import os
from dotenv import load_dotenv, find_dotenv

# Load environment from the nearest .env (prefer repo root)
load_dotenv(find_dotenv())

class Config:
   DEBUG=False
   Testing=False
   SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
   SQLALCHEMY_TRACK_MODIFICATIONS = False
   SECRET_KEY = os.getenv("SECRET_KEY")
   AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
   AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
   AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
   
   FLASK_ENV = os.getenv("FLASK_ENV")
   if FLASK_ENV == "development":
      # frontend origin for CORS (set to '*' for dev)
      FRONTEND_URL = os.getenv("http://localhost:5173")
      FASTAPI_URL = os.getenv("http://localhost:8000")
   elif  FLASK_ENV == "production":
      FRONTEND_URL = os.getenv("FRONTEND_URL", "https://tenaai.vercel.app")
      FASTAPI_URL = os.getenv("FASTAPI_URL", "https://tena-fastapi.onrender.com")
   else:
      FRONTEND_URL = "https://tenaai.vercel.app"
      FASTAPI_URL = "https://tena-fastapi.onrender.com"      
           