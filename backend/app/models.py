from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from sqlalchemy import Integer, String, Text, DateTime, Column, ForeignKey
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import os
import secrets

db = SQLAlchemy()

RESET_TOKEN_LIFESPAN = timedelta(hours=1)

class User(db.Model, UserMixin):
   __tablename__ = "user"
   user_id = db.Column(db.Integer, primary_key=True) 
   user_name = db.Column(db.String(128), nullable=False)
   email = db.Column(db.String(128), nullable=False, index=True, unique=True)
   password_hash = db.Column(db.String(128), nullable=False)
   created_at = db.Column(db.DateTime, default=datetime.utcnow())
   
   is_admin = db.Column(db.Boolean, default=False)
   chat_sessions = db.relationship('ChatSession', backref='user', lazy='dynamic')
    
   reset_token = db.Column(db.String(128), nullable=True) 
   reset_token_expiration = db.Column(db.DateTime, nullable=True)
   
   def __repr__(self):
      return f"<User {self.email}>" 
   
   def get_id(self):
      return str(self.user_id)
   
   def set_password(self, password):
      self.password_hash = generate_password_hash(password)
      
   def check_password(self, password):
      return check_password_hash(self.password_hash, password)   
      
   def generate_reset_token(self):
      """Generates a secure token and sets its issuance time."""
      self.reset_token = secrets.token_hex(32)
      self.reset_token_issued_at = datetime.utcnow()
      return self.reset_token

   def is_reset_token_valid(self):
      """Checks if the stored token is still within the expiration window."""
      if self.reset_token and self.reset_token_issued_at:
         return datetime.utcnow() < self.reset_token_issued_at + RESET_TOKEN_LIFESPAN
  
   def check_reset_token(self, token):
      """Combines token match and expiration check."""
      return (
         self.reset_token == token and 
         self.is_reset_token_valid()
      )
    
   def clear_reset_token(self):
      """Clear the token fields after a successful reset or failure."""
      self.reset_token = None
      self.reset_token_expiration = None
   
    
class ChatSession(db.Model):  
   __tablename__ = "chat_session"
   chat_id = Column(Integer, primary_key=True) 
   user_id = Column(Integer, ForeignKey('user.user_id'), nullable=True, index=True) # Link to User
   session_uuid = Column(String(128), unique=True, nullable=False) 
   created_at = Column(DateTime, default=datetime.utcnow)
 
   messages = relationship('Message', backref="session", lazy='dynamic')
    
   def __repr__(self):
      return f"<ChatSession {self.chat_id}>"
 
class Message(db.Model):
   __tablename__ = "message"
   message_id = Column(Integer, primary_key=True)  
   # Integer PK as the Foreign Key for efficiency
   chat_id = Column(Integer, ForeignKey('chat_session.chat_id'), nullable=False, index=True) 
   sender = Column(String(10)) # 'user' or 'bot'
   content = Column(Text, nullable=False)
   timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
   def __repr__(self):
      return f"<Message {self.message_id} from {self.sender}>"