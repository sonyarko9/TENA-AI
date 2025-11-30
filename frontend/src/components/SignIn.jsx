import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Heart, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const SignIn = ({ onSignIn, onNavigateToSignUp, onSkipLogin, onNavigateToForgotPassword }) => {
//                                                               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^ NEW PROP
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
        
    setErrors(prev => ({ ...prev, submit: '' })); 

    if (validateForm()) {
      setIsLoading(true);
          
      try {
        // Call the API login function
        const result = await api.login(
                      formData.email, 
                      formData.password 
        );

        // Login successful (Backend returns 200 and user data)
        // NOTE: Ensure your api.login returns 'email' and 'user_id' fields.
        onSignIn({ 
          email: result.email, 
          userId: result.user_id 
        }); 

      } catch (error) {
        // Handle API errors (401 Unauthorized, etc.)
        console.error('Login failed:', error);
                
        let errorMessage = 'An unexpected error occurred during sign in.';
                
        // Check for specific error message structure from your backend API service
        if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Server error')) {
          errorMessage = 'The server is temporarily unavailable. Please try again later.';
        }

        setErrors(prev => ({ ...prev, submit: errorMessage }));

      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGuestContinue = () => {
    if (onSkipLogin) {
      onSkipLogin();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <Heart className="logo-icon" />
            <span>Tena AI</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue your wellness journey</p>
        </div>

        <div className="auth-form">
          {errors.submit && (
            <div className="error-message submit-error">
              <AlertCircle size={16} />
              <span>{errors.submit}</span> 
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={20} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={errors.email ? 'error' : ''}
              />
            </div>
            {errors.email && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.password}</span>
              </div>
            )}
            
            {/* ---Forgot Password Link --- */}
            <button 
              type="button" 
              className="auth-link forgot-password-link"
              onClick={onNavigateToForgotPassword}
              // Style adjustment might be needed in App.css for proper positioning
              style={{ alignSelf: 'flex-end', marginTop: '5px', fontSize: '0.9em' }}
            >
              Forgot Password?
            </button>
            {/* ---------------------------------- */}
          </div>

          <button 
            type="button"
            className="auth-submit-btn"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button 
          className="guest-btn"
          onClick={handleGuestContinue}
        >
          Continue as Guest
        </button>

        <p className="auth-footer-text">
          Don't have an account?{' '}
          <button 
            className="auth-link"
            onClick={onNavigateToSignUp}
          >
            Sign Up
          </button>
        </p>

        <p className="privacy-note">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignIn;