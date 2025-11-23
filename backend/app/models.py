from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, String, Text, DateTime, Column, ForeignKey
from sqlalchemy.orm import relationship

db = SQLAlchemy()

# Using Flask-Login standards for eventual Auth integration
class User(db.Model):
   __tablename__ = "user"
   user_id = Column(Integer, primary_key=True) 
   user_name = Column(String(100), nullable=False)
    
   chats = relationship('ChatSession', backref='user', lazy='dynamic')
    
   def __repr__(self):
      return f"<User {self.user_name}>" 
    
class ChatSession(db.Model):  
   __tablename__ = "chat_session"
   chat_id = Column(Integer, primary_key=True) 
   user_id = Column(Integer, ForeignKey('user.user_id'), nullable=True, index=True) # Link to User
   session_uuid = Column(String(128), unique=True, nullable=False) 
   created_at = Column(DateTime, default=db.func.now())
 
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
   timestamp = Column(DateTime, default=db.func.now(), index=True)
    
   def __repr__(self):
      return f"<Message {self.message_id} from {self.sender}>"