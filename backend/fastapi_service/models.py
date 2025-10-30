from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(100), nullable=False)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    chat_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())

class Message(Base):
    __tablename__ = "messages"
    
    message_id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(128), ForeignKey("chat_sessions.session_id"), nullable=False)
    sender = Column(String(10))  # 'user' or 'bot'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())