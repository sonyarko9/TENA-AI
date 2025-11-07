from flask import Flask
from flask_cors import CORS
from config import Config
from app.routes import main_bp
from .models import db
import os


def create_app():
   app = Flask(__name__)
   app.config.from_object(Config)  # Load config
   db.init_app(app)

   # Allow configuring the frontend origin via FRONTEND_URL env var / config
   default_origins = ["https://tenaai.vercel.app", "http://localhost:5173", "http://localhost:3000"]
   cors_origins = app.config.get("FRONTEND_URL", "http://localhost:5173")
   if not cors_origins:
      origins = default_origins
   elif isinstance(cors_origins, str) and "," in cors_origins:
      origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
   else:
      origins = [cors_origins]

   # Apply CORS globally and on the API blueprint to ensure preflight matches
   CORS(
      app,
      resources={r"/*": {"origins": origins}},
      supports_credentials=False,
      allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
      methods=["GET", "POST", "OPTIONS"],
   )

   # Register routes blueprint
   app.register_blueprint(main_bp, url_prefix="/api")

   with app.app_context():
      db.create_all()

   return app
