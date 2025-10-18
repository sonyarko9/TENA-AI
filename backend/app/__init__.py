from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Load config
    from config import Config
    app.config.from_object(Config)

    # Register routes
    from app.routes import bp
    app.register_blueprint(bp, url_prefix="/api")

    return app
