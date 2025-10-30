import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, X, UserPlus, LogIn } from 'lucide-react';
import './App.css'
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';

const App = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tena-theme') || 'light';
  });

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state
    if (!window.history.state) {
      window.history.replaceState({ page: currentPage }, '');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Update history when page changes
  useEffect(() => {
    if (window.history.state?.page !== currentPage) {
      window.history.pushState({ page: currentPage }, '');
    }
  }, [currentPage]);

  // Apply theme to body
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('tena-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Auth Dialog Component
  const AuthDialog = () => {
    if (!showAuthDialog) return null;

    return (
      <div className="auth-dialog-overlay" onClick={() => setShowAuthDialog(false)}>
        <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
          <button className="dialog-close" onClick={() => setShowAuthDialog(false)}>
            <X size={20} />
          </button>
          
          <div className="dialog-icon">
            <Heart size={32} />
          </div>
          
          <h3>Welcome to Tena AI</h3>
          <p>
            Sign in to save your conversations and track your wellness journey, 
            or continue as a guest for a quick chat session.
          </p>

          <div className="dialog-actions">
            <button 
              className="dialog-button primary"
              onClick={() => {
                setShowAuthDialog(false);
                setCurrentPage('signin');
              }}
            >
              <LogIn size={20} />
              Sign In
            </button>
            
            <button 
              className="dialog-button secondary"
              onClick={() => {
                setShowAuthDialog(false);
                setCurrentPage('signup');
              }}
            >
              <UserPlus size={20} />
              Create Account
            </button>

            <button 
              className="dialog-button secondary"
              onClick={() => {
                setShowAuthDialog(false);
                setIsAuthenticated(false);
                setCurrentPage('chat');
              }}
            >
              <MessageCircle size={20} />
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle Start Chat from Landing Page
  const handleStartChat = () => {
    setShowAuthDialog(true);
  };

  // Handle Successful Sign In
  const handleSignIn = (email) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setCurrentPage('chat');
  };

  // Handle Successful Sign Up
  const handleSignUp = (email) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    setCurrentPage('chat');
  };

  // Handle Guest Continue
  const handleGuestContinue = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setCurrentPage('chat');
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    setCurrentPage('landing');
  };

  return (
    <div className="app">
      {/* Auth Dialog */}
      <AuthDialog />

      {/* Page Routing */}
      {currentPage === 'landing' && (
        <LandingPage onStartChat={handleStartChat} />
      )}

      {currentPage === 'signin' && (
        <SignIn 
          onSignIn={handleSignIn}
          onSkipLogin={handleGuestContinue}
          onNavigateToSignUp={() => setCurrentPage('signup')}
        />
      )}

      {currentPage === 'signup' && (
        <SignUp 
          onSignUp={handleSignUp}
          onNavigateToSignIn={() => setCurrentPage('signin')}
        />
      )}

      {currentPage === 'chat' && (
        <ChatPage 
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};

export default App;