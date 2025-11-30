from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from .models import db
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

migrate = Migrate()
bcrypt = Bcrypt()
login_manager = LoginManager()

login_manager.session_protection = "strong"
login_manager.login_view = "auth_api.login"
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
   """Callback function to reload the user object from tyhe session ID"""  
   from .models import User
   return User.query.get(int(user_id)) 

@login_manager.unauthorized_handler
def unauthorized():
   """Custom handler for unauthorized requests (e.g., when @login_required fails)."""
   return jsonify({"message": "Authentication required to access this resource."}), 401
 
def create_app():
   app = Flask(__name__)
   app.config.from_object(Config)  # Load config
   db.init_app(app)
   migrate.init_app(app, db)
   bcrypt.init_app(app)
   login_manager.init_app(app)

   # Allow configuring the frontend origin via FRONTEND_URL env var / config
   default_origins = ["https://tenaai.vercel.app", "http://localhost:5173", "http://localhost:3000"]
   cors_origins = app.config.get("FRONTEND_URL", "http://localhost:5173")
   if not cors_origins:
      origins = default_origins
   elif isinstance(cors_origins, str) and "," in cors_origins:
      origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
   else:
      origins = [cors_origins]

   # Register blueprints and apply CORS to each one individually
   from app.routes.routes import main_bp
   from app.routes.auth_routes import auth_bp
   from app.routes.admin_routes import admin_bp

   CORS(main_bp, resources={r"/*": {"origins": origins}}, supports_credentials=True)
   app.register_blueprint(main_bp, url_prefix="/api")
    
   CORS(auth_bp, resources={r"/*": {"origins": origins}}, supports_credentials=True)
   app.register_blueprint(auth_bp, url_prefix="/api/auth")

   CORS(admin_bp, resources={r"/*": {"origins": origins}}, supports_credentials=True)
   app.register_blueprint(admin_bp, url_prefix="/api/admin")
   
   return app
