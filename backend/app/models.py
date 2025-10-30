from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
   user_id = db.Column(db.Integer, primary_key=True)
   user_name = db.Column(db.String(100), nullable=False)
   
class ChatSession(db.Model):   
   chat_id = db.Column(db.Integer, primary_key=True)
   session_id  = db.Column(db.String(128), unique=True, nullable=False)
   created_at = db.Column(db.DateTime, default=db.func.now())
  
class Message(db.Model):
   message_id = db.Column(db.Integer, primary_key=True)   
   session_id = db.Column(db.String(128), db.ForeignKey('chat_session.session_id'), nullable=False)
   sender = db.Column(db.String(10)) # 'user' or 'bot'
   content = db.Column(db.Text, nullable=False)
   timestamp = db.Column(db.DateTime, default=db.func.now())