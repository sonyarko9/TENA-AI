import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

class Config:
   DEBUG = False
   TESTING = False
   SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
   SQLALCHEMY_TRACK_MODIFICATIONS = False
   SECRET_KEY = os.getenv("SECRET_KEY")
   AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
   AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
   AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
   FRONTEND_URL = os.getenv("FRONTEND_URL")
   # SameSite=Lax works for localhost dev (HTTP); production uses None+Secure via env override
   SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
   SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"

   @classmethod
   def validate(cls):
      if not cls.SECRET_KEY:
         raise RuntimeError("SECRET_KEY environment variable is not set. Refusing to start.")
