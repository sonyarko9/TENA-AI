import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Plus, History, Settings, LogOut, Menu, X, Heart, Sun, Moon } from 'lucide-react';

const ChatPage = ({ onLogout, isAuthenticated, userEmail, theme, onToggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState(
    isAuthenticated ? [
      { id: 1, title: 'My first conversation', date: '2024-10-15' },
      { id: 2, title: 'Feeling anxious today', date: '2024-10-18' },
    ] : []
  );
  const [currentChatId, setCurrentChatId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: "I hear you, and I'm here for you. Thank you for sharing that with me. How are you feeling right now?",
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    if (isAuthenticated) {
      const newChat = {
        id: Date.now(),
        title: 'New conversation',
        date: new Date().toISOString().split('T')[0]
      };
      setChatHistory([newChat, ...chatHistory]);
      setCurrentChatId(newChat.id);
    }
    
    setMessages([{
      id: Date.now(),
      text: "Hello! I'm Tena, your mental wellness companion. How are you feeling today?",
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <div className={`chat-page ${theme}`}>
      <button 
        className="mobile-menu-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Heart className="logo-icon" />
            <span>Tena AI</span>
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <Plus size={20} />
          New Conversation
        </button>

        <div className="sidebar-section">
          <div className="section-title">
            <History size={18} />
            Chat History {!isAuthenticated && '(Guest)'}
          </div>
          {isAuthenticated ? (
            <div className="chat-history">
              {chatHistory.map(chat => (
                <div 
                  key={chat.id} 
                  className={`chat-history-item ${currentChatId === chat.id ? 'active' : ''}`}
                  onClick={() => setCurrentChatId(chat.id)}
                >
                  <MessageCircle size={16} />
                  <div className="chat-info">
                    <p className="chat-title">{chat.title}</p>
                    <p className="chat-date">{chat.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '1rem', 
              color: theme === 'dark' ? '#a0a0a0' : '#808080', 
              fontSize: '0.875rem', 
              textAlign: 'center', 
              lineHeight: '1.6' 
            }}>
              Sign in to save and access your chat history
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-btn theme-toggle-btn" onClick={onToggleTheme}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="sidebar-btn">
            <Settings size={20} />
            Settings
          </button>
          <button className="sidebar-btn" onClick={onLogout}>
            <LogOut size={20} />
            {isAuthenticated ? 'Logout' : 'Back to Home'}
          </button>
        </div>
      </aside>

      <main className="chat-main">
        <div className="chat-header">
          <h2>Chat with Tena</h2>
          <p>
            {isAuthenticated 
              ? `Signed in as ${userEmail} • Your conversations are saved` 
              : 'Guest Mode • Conversations will not be saved'}
          </p>
        </div>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <Heart size={64} />
              <h3>Welcome to Tena AI</h3>
              <p>
                I'm here to listen and support you. Feel free to share what's on your mind.
                {!isAuthenticated && ' (Guest mode: messages won\'t be saved)'}
              </p>
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">{message.timestamp}</span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Share your thoughts..."
            className="message-input"
          />
          <button 
            onClick={handleSendMessage} 
            className="send-button"
            disabled={!inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;