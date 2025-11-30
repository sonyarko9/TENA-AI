import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

const ResetPassword = ({ onBackToLogin }) => {
    const [token, setToken] = useState(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    useEffect(() => {
        // Extract token directly from window.location.search
        const query = new URLSearchParams(window.location.search);
        const urlToken = query.get('token');
        
        if (urlToken) {
            setToken(urlToken);
        } else {
            setIsValidToken(false);
            setStatus({ message: 'Missing password reset token in URL.', type: 'error' });
        }
    }, []); // Run only once on mount

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setStatus({ message: 'Password must be at least 8 characters long.', type: 'error' });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({ message: 'Passwords do not match.', type: 'error' });
            return;
        }

        if (!token) {
             setStatus({ message: 'Cannot reset password without a valid token.', type: 'error' });
             return;
        }

        setIsLoading(true);
        setStatus({ message: '', type: '' });

        try {
            const response = await api.resetPassword(token, password);
            setStatus({ 
                message: response.message || "Your password has been successfully reset. Please log in.", 
                type: 'success' 
            });
            // Clear inputs on success
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            // Note: If the token is invalid/expired, the backend should return a 401/403
            const errorMessage = error.response?.data?.error || "Failed to reset password. Token may be invalid or expired.";
            
            // Setting this to false triggers the 'Invalid Link' return block
            setIsValidToken(false); 
            
            setStatus({ 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    // ----------------------------------------------------
    // --- RENDER BLOCKS ---
    // ----------------------------------------------------

    // 1. Invalid/Expired Token View
    if (!isValidToken && status.type !== 'success') {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <AlertTriangle size={64} className="dialog-icon error-icon" />
                        <h1>Invalid Link</h1>
                        <p className={`error-text`}>{status.message || "The password reset link is invalid or has expired."}</p>
                    </div>
                    {/* Navigate back to Forgot Password screen using the App's router */}
                    <button 
                        type="button" 
                        className="auth-submit-btn" 
                        onClick={() => onBackToLogin('forgot')} 
                    >
                        Request a New Reset Link
                    </button>
                    <div className="auth-footer-text">
                        <button 
                            type="button" 
                            className="auth-link" 
                            onClick={() => onBackToLogin('signin')} // Navigate to signin page
                        >
                            <ArrowLeft size={16} style={{ marginRight: '5px' }} /> Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // 2. Success View
    if (status.type === 'success') {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        {/* Use class names for proper styling */}
                        <CheckCircle size={64} className="dialog-icon success-icon" /> 
                        <h1>Success!</h1>
                        <p>{status.message}</p>
                    </div>
                    {/* Navigate to Login after successful reset */}
                    <button 
                        type="button" 
                        className="auth-submit-btn" 
                        onClick={() => onBackToLogin('signin')}
                    >
                        Proceed to Sign In
                    </button>
                </div>
            </div>
        );
    }

    // 3. Main Reset Form View
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Set New Password</h1>
                    <p>Enter your new password below.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password (Min 8 characters)</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="8"
                                placeholder="Min 8 characters"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter password"
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="auth-submit-btn" 
                        disabled={isLoading || !token || password.length < 8 || password !== confirmPassword}
                    >
                        {isLoading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                </form>

                {status.message && status.type === 'error' && (
                    <p className={`auth-status-message ${status.type}`}>
                        <AlertTriangle size={16} /> {status.message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;