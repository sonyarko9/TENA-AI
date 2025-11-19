from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
   __tablename__ = "user"
   user_id = db.Column(db.Integer, primary_key=True)
   user_name = db.Column(db.String(100), nullable=False)
   
   def __repr__(self):
        return f"<User {self.user_name}>"  
   
class ChatSession(db.Model):   
   __tablename__ = "chat_session"
   chat_id = db.Column(db.Integer, primary_key=True)
   session_id  = db.Column(db.String(128), unique=True, nullable=False)
   created_at = db.Column(db.DateTime, default=db.func.now())
  
   messages = db.relationship('Message', backref="session", lazy='dynamic')
   
   def __repr__(self):
        return f"<ChatSession {self.session_id}>"
  
class Message(db.Model):
   __tablename__ = "message"
   message_id = db.Column(db.Integer, primary_key=True)   
   session_id = db.Column(db.String(128), db.ForeignKey('chat_session.session_id'), nullable=False)
   sender = db.Column(db.String(10)) # 'user' or 'bot'
   content = db.Column(db.Text, nullable=False)
   timestamp = db.Column(db.DateTime, default=db.func.now())
   
   def __repr__(self):
      return f"<Message {self.id} from {self.sender}>"   