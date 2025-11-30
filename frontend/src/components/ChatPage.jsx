import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    MessageCircle, Send, Plus, History, Settings, LogOut, 
    Menu, X, Heart, Sun, Moon, Gauge 
} from 'lucide-react';
import { api } from '../services/api';

const ChatPage = ({ onLogout, isAuthenticated, userEmail, theme, onToggleTheme, isAdmin, onNavigate }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    
    // State to hold the current chat's internal ID 
    const [currentChatId, setCurrentChatId] = useState(null); 
    // State to hold the current chat's public UUID (used for API calls)
    const [currentSessionUUID, setCurrentSessionUUID] = useState(null); 
    
    const messagesEndRef = useRef(null);

    // --- Utility Functions ---

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Handlers ---
    
    // loadSessionMessages requires access to state setters
    const loadSessionMessages = useCallback(async (sessionId) => {
        if (!isAuthenticated) return;

        // sessionId here is the session_uuid from the backend history API
        setCurrentChatId(sessionId); 
        setMessages([]);

        try {
            // api.getMessagesBySessionId handles the UUID parameter
            const fetchedMessagesArray = await api.getMessagesBySessionId(sessionId);
            
            // ensure variable is an array before mapping
            const messagesToFormat = Array.isArray(fetchedMessagesArray) ? fetchedMessagesArray : [];
            
            // map directly on the array
            const formattedMessages = messagesToFormat.map(msg => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender === 'bot' ? 'ai' : 'user', 
                timestamp: msg.timestamp,
            }));

            setMessages(formattedMessages);
            setCurrentSessionUUID(sessionId); // Set the UUID for continued chatting
        } catch (error) {
            console.error("Failed to load messages:", error);
            setMessages([
                { 
                    id: Date.now(), 
                    text: 'Could not load this conversation. It may no longer exist.', 
                    sender: 'ai', 
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                }
            ]);
        }
    }, [isAuthenticated]); 

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const newMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const currentInput = inputValue;
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');

        const placeholderId = Date.now() + 1;
        const typingPlaceholder = {
            id: placeholderId,
            text: "Tena is typing...",
            sender: 'ai-placeholder', 
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, typingPlaceholder]);

        try {
            // Send message with the current session UUID
            const response = await api.chat(currentInput, currentSessionUUID);

            // If a NEW session was created (currentSessionUUID was null), update it
            if (response.session_id && response.session_id !== currentSessionUUID) {
                setCurrentSessionUUID(response.session_id);
                // Also refresh history to show the new chat for authenticated users
                if (isAuthenticated) {
                    await fetchChatHistory(); 
                }
            }

            const aiResponse = {
                id: Date.now() + 2,
                text: response.reply || "An unknown response was received.", 
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })        
            };

            // Remove placeholder and add REAL response
            setMessages(prev => {
                const messagesWithoutPlaceholder = prev.filter(msg => msg.id !== placeholderId);
                return [...messagesWithoutPlaceholder, aiResponse];
            });
        } catch (error) {
            console.error("API call failed, using fallback:", error);

            // fallback error if AI fails
            const fallbackResponse = {
                id: Date.now() + 3,
                text: "I'm sorry, I couldn't connect to the server. Please check your network.",
                sender: 'ai',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })        
            }

            setMessages(prev => {
                const messagesWithoutPlaceholder = prev.filter(msg => msg.id !== placeholderId);
                return [...messagesWithoutPlaceholder, fallbackResponse];
            });
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleNewChat = () => {
        // Reset all states for a new conversation
        setCurrentChatId(null);
        setCurrentSessionUUID(null);
        
        // Show initial welcome message
        setMessages([{
            id: Date.now(),
            text: "Hello! I'm Tena, your mental wellness companion. How are you feeling today?",
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // If authenticated, optimistic update for history view (title updated by next API response)
        if (isAuthenticated) {
            const tempSessionId = `temp-${Date.now()}`;
            const newChat = {
                session_id: tempSessionId, // Use temp ID for the history list item
                title: 'New conversation',
                date: new Date().toISOString().split('T')[0]
            };
            setChatHistory(prev => [newChat, ...prev.filter(c => c.session_id !== tempSessionId)]);
            setCurrentChatId(tempSessionId);
        }
    };

    // Helper function extracted from useEffect
    const fetchChatHistory = async () => {
        try {
            const history = await api.getChatHistory();
            const safeHistory = Array.isArray(history) ? history : [];
            setChatHistory(safeHistory);

            // If a UUID exists from a previous session (e.g., Guest mode), load it first.
            // Otherwise, load the latest stored chat.
            if (history.length > 0) {
                const defaultSessionId = currentSessionUUID || history[0].session_id;
                await loadSessionMessages(defaultSessionId);
            } else {
                // If history is empty, start a new chat sequence
                handleNewChat();
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            if (error.message.includes('401')) {
                //onLogout(); // Force logout on 401
            }
            setChatHistory([]);
        }
    };

    // --- Lifecycle Effects ---

    // Load history and first session on authentication change
    useEffect(() => {
        if (isAuthenticated) {
            fetchChatHistory();
        } else {
            // Guest mode cleanup/reset
            setChatHistory([]); 
            handleNewChat();
        }
    }, [isAuthenticated, onLogout, loadSessionMessages]);

    // Scroll to bottom on messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- Component Render ---
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
                                    // Use session_id/UUID as key
                                    key={chat.session_id} 
                                    className={`chat-history-item ${currentChatId === chat.session_id ? 'active' : ''}`}
                                    onClick={() => loadSessionMessages(chat.session_id)}
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
                        <div style={{ padding: '1rem', color: theme === 'dark' ? '#a0a0a0' : '#808080', fontSize: '0.875rem', textAlign: 'center', lineHeight: '1.6' }}>
                            Sign in to save and access your chat history
                        </div>
                    )}
                </div>

                <div className="sidebar-footer">
                    {isAuthenticated && (
                        <div className="user-profile-info">
                            <p className="user-email-display">{userEmail}</p>
                        </div>
                    )}
                    
                    {/* Admin Dashboard Link */}
                    {isAdmin && (
                        <button className="sidebar-btn admin-btn" onClick={() => onNavigate('admin')}>
                            <Gauge size={20} />
                            Admin Dashboard
                        </button>
                    )}
                    
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
                        messages.map((message) => (
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