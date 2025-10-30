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
   cors_origins = app.config.get("FRONTEND_URL", "*")
   CORS(app, resources={r"/api/*": {"origins": cors_origins}})

   # Register routes blueprint
   app.register_blueprint(main_bp, url_prefix="/api")

   with app.app_context():
      db.create_all()

   return app
