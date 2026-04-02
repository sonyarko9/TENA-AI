from flask import Flask, jsonify, request
from flask_migrate import Migrate
from config import Config
from .models import db
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

migrate = Migrate()
bcrypt = Bcrypt()
login_manager = LoginManager()

# "basic" avoids session invalidation on IP/user-agent change (safe for cross-origin API)
login_manager.session_protection = "basic"
login_manager.login_view = "auth_api.login"
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
   from .models import User
   return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
   return jsonify({"message": "Authentication required to access this resource."}), 401

def create_app():
   Config.validate()
   app = Flask(__name__)
   app.config.from_object(Config)
   db.init_app(app)
   migrate.init_app(app, db)
   bcrypt.init_app(app)
   login_manager.init_app(app)

   allowed_origins = {"https://tenaai.vercel.app", "http://localhost:5173", "http://localhost:3000"}
   extra = app.config.get("FRONTEND_URL")
   if extra:
      for url in extra.split(","):
         url = url.strip()
         if url:
            allowed_origins.add(url)

   @app.before_request
   def handle_preflight():
      if request.method == "OPTIONS":
         origin = request.headers.get("Origin", "")
         if origin in allowed_origins:
            resp = app.make_response("")
            resp.status_code = 204
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            resp.headers["Vary"] = "Origin"
            return resp

   @app.after_request
   def add_cors_headers(response):
      origin = request.headers.get("Origin", "")
      if origin in allowed_origins:
         response.headers["Access-Control-Allow-Origin"] = origin
         response.headers["Access-Control-Allow-Credentials"] = "true"
         response.headers["Vary"] = "Origin"
      return response

   from app.routes.routes import main_bp
   from app.routes.auth_routes import auth_bp
   from app.routes.admin_routes import admin_bp

   app.register_blueprint(main_bp, url_prefix="/api")
   app.register_blueprint(auth_bp, url_prefix="/api/auth")
   app.register_blueprint(admin_bp, url_prefix="/api/admin")

   return app
