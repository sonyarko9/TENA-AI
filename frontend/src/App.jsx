import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, X, UserPlus, LogIn, Gauge } from 'lucide-react';
import './App.css';
import LandingPage from './components/LandingPage';
import ChatPage from './components/ChatPage';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ForgotPassword from './components/auth/ForgotPassword'; 
import ResetPassword from './components/auth/ResetPassword'; 

// --- Auth Dialog Component ---
const AuthDialog = ({ onNavigate, onContinueAsGuest, onClose }) => {
    return (
        <div className="auth-dialog-overlay" onClick={onClose}>
            <div className="auth-dialog" onClick={(e) => e.stopPropagation()}>
                <button className="dialog-close" onClick={onClose}>
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
                        onClick={() => { onClose(); onNavigate('signin'); }}
                    >
                        <LogIn size={20} />
                        Sign In
                    </button>
                    
                    <button 
                        className="dialog-button secondary"
                        onClick={() => { onClose(); onNavigate('signup'); }}
                    >
                        <UserPlus size={20} />
                        Create Account
                    </button>

                    <button 
                        className="dialog-button secondary"
                        onClick={() => { onClose(); onContinueAsGuest(); }}
                    >
                        <MessageCircle size={20} />
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- App Content Component (Contains Core Logic) ---
const AppContent = () => {
    const { 
        isAuthenticated, 
        setIsAuthenticated,
        user, 
        setUser,
        isLoading, 
        logout, 
        login,
        isGuest,
        setIsGuest,
    } = useAuth(); 
    
    const [currentPage, setCurrentPage] = useState('landing');
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('tena-theme') || 'light';
    });

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const ADMIN_EMAIL = 'tenaai.app@gmail.com';
    const isAdmin = user?.is_admin === true || user?.email === ADMIN_EMAIL; 
    
    // Helper to safely navigate and manage history
    const navigate = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // --- History Management Effects ---
    
    // Handle browser back/forward (PopState)
    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state && event.state.page) {
                navigate(event.state.page);
            }
        };

        window.addEventListener('popstate', handlePopState);
        if (!window.history.state) {
            window.history.replaceState({ page: currentPage }, '');
        }
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [currentPage, navigate]);

    // Update history when page changes (PushState)
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
    
    // --- Authentication and Routing Logic ---
    
    useEffect(() => {
        if (isLoading) return;

        // --- UPDATED PUBLIC PAGES ARRAY ---
        // Allows unauthorized users to visit signin, signup, forgot, and reset-password
        const publicPages = ['landing', 'signin', 'signup', 'forgot', 'reset-password'];

        // If authenticated and on a public page, redirect to chat (or admin)
        if (isAuthenticated && publicPages.includes(currentPage)) {
            if (isAdmin) {
                navigate('admin');
            } else {
                navigate('chat');
            }
        } 
        
        // SECURITY CHECK: If user is not authenticated and is on a protected page
        if (!isAuthenticated && !isGuest && (currentPage === 'chat' || currentPage === 'admin')) {
            // Note: Forgot/Reset are public and intentionally excluded from this redirect
            navigate('landing');
        }

        // SECURITY CHECK: Non-admin trying to access the admin page directly
        if (currentPage === 'admin' && !isAdmin) {
            navigate(isAuthenticated ? 'chat' : 'landing');
        }

    }, [isAuthenticated, isGuest, isLoading, currentPage, isAdmin, navigate]);

    // --- Handlers ---

    const handleStartChat = () => {
        if (isAuthenticated) {
            navigate('chat');
        } else {
            setShowAuthDialog(true);
        }
    };
    
    const handleSignInSuccess = (userData) => { 
        login(userData); 
        if (userData.email === ADMIN_EMAIL) {
            navigate('admin');
        } else {
            navigate('chat');
        }
    };

    const handleLogout = async () => {
        await logout(); 
        navigate('landing');
    };

    const handleGuestContinue = () => {
        setShowAuthDialog(false);
        setIsAuthenticated(false);
        setUser(null);
        setIsGuest(true);

        navigate('chat');
    };
    
    // Show loading state while checking initial status
    if (isLoading) {
        return <div className={`app ${theme}`}>Loading...</div>;
    }

    // --- PAGE RENDERING ---
    let PageComponent = null;

    if (currentPage === 'landing') {
        // ... Landing page setup ...
        PageComponent = (
            <>
                <LandingPage onStartChat={handleStartChat} />
                {isAuthenticated && isAdmin && (
                    <button 
                        className="admin-dev-btn" 
                        onClick={() => navigate('admin')}
                        style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '10px', zIndex: 1000, background: '#a0a0ff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        <Gauge size={16} style={{ marginRight: '5px' }} /> Go to Admin
                    </button>
                )}
            </>
        );
    } else if (currentPage === 'signin') {
        PageComponent = (
            <SignIn 
                onSignIn={handleSignInSuccess} 
                onSkipLogin={handleGuestContinue}
                onNavigateToSignUp={() => navigate('signup')}
                onNavigateToForgotPassword={() => navigate('forgot')} 
            />
        );
    } else if (currentPage === 'signup') {
        PageComponent = (
            <SignUp 
                onSignUp={() => navigate('signin')}
                onNavigateToSignIn={() => navigate('signin')}
            />
        );
    } else if (currentPage === 'chat') {
        PageComponent = (
            <ChatPage 
                onLogout={handleLogout}
                isAuthenticated={isAuthenticated}
                userEmail={user?.email || ''}
                theme={theme}
                onToggleTheme={toggleTheme}
                isAdmin={isAdmin}
                onNavigate={navigate}
            />
        );
    } else if (currentPage === 'admin') {
        if (isAdmin) {
            PageComponent = <AdminDashboard />;
        } else {
            PageComponent = <LandingPage onStartChat={handleStartChat} />;
        }

    // AUTH PAGES
    } else if (currentPage === 'forgot') {
        PageComponent = (
            <ForgotPassword 
                onBackToLogin={() => navigate('signin')}
            />
        );
    } else if (currentPage === 'reset-password') {
        // ResetPassword component is expected to read the token from window.location.search
        // and handle navigation back to signin on success.
        PageComponent = <ResetPassword onBackToLogin={() => navigate('signin')} />;
    }

    return (
        <div className={`app ${theme}`}>
            {showAuthDialog && (
                <AuthDialog
                    onClose={() => setShowAuthDialog(false)}
                    onNavigate={navigate}
                    onContinueAsGuest={handleGuestContinue}
                />
            )}
            {PageComponent}
        </div>
    );
};

// Export Wrapped App Component
const App = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;