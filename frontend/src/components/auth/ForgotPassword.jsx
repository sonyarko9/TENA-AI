import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

const ForgotPassword = ({ onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    
    // Simple email validation
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateEmail(email)) {
             setStatus({ 
                message: 'Please enter a valid email address.', 
                type: 'error' 
            });
            return;
        }

        setIsLoading(true);
        setStatus({ message: '', type: '' });

        try {
            // NOTE: The backend should ideally return a generic success message
            // even if the email doesn't exist, to prevent enumeration attacks.
            const response = await api.forgotPassword(email);
            setStatus({ 
                message: response.message || "If an account exists, a password reset link has been sent to your email.", 
                type: 'success' 
            });
            // We intentionally do NOT clear the email field on success here 
            // so the user can see which email they used.
        } catch (error) {
            // Assuming your backend API service (api.js) throws the error object
            const errorMessage = error.response?.data?.error || "Failed to process request. Please try again.";
            
            // For a production app, the generic success message is better even for an API error, 
            // but we'll use the specific error here for development feedback.
            setStatus({ 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Wrap with auth-page for full-screen styling consistency
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Forgot Password</h1>
                    <p>Enter your email and we'll send you a link to reset your password.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    {status.message && (
                        <p className={`auth-status-message ${status.type}`}>
                            <AlertCircle size={16} /> 
                            {status.message}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        className="auth-submit-btn" // Use the standard submit button class
                        disabled={isLoading || !email} // Disable if loading or email is empty
                    >
                        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="auth-footer-text">
                    <button 
                        type="button" 
                        className="auth-link" 
                        onClick={onBackToLogin} // Call the navigation prop
                    >
                        <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;