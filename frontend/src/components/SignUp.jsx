import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Heart, AlertCircle, User } from 'lucide-react';
import { api } from '../services/api';

const SignUp = ({ onSignUp, onNavigateToSignIn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return {
      isStrong: hasUpperCase && hasLowerCase && hasNumber && password.length >= 8,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasMinLength: password.length >= 8
    };
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordCheck = validatePasswordStrength(formData.password);
      if (!passwordCheck.hasMinLength) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!passwordCheck.hasUpperCase) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!passwordCheck.hasLowerCase) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!passwordCheck.hasNumber) {
        newErrors.password = 'Password must contain at least one number';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);

      // We use name for the user_name backend field
      const userName = formData.name.trim();

      try {
        // Call the real API register function
        const result = await api.register(
            formData.email, 
            formData.password, 
            userName 
        );

        // Registration successful
        // Now, automatically log the user in or navigate to sign-in
        alert('Registration successful! Please sign in.');
        onNavigateToSignIn(); 

      } catch (error) {
        // Handle registration errors
        console.error('Registration failed:', error);
                
        // Display a user-friendly error message
        setErrors({ 
            submit: error.message || 'An unexpected error occurred during registration.' 
        });

        // Check for specific error messages (like from the 409 check)
        if (error.message.includes('already exists')) {
            setErrors({ email: 'This email is already registered.' });
        }

      } finally {
          setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
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
          <h1>Create Your Account</h1>
          <p>Start your journey to better mental wellness</p>
        </div>

        <div className="auth-form">
          {errors.submit && (
            <div className="error-message submit-error">
              <AlertCircle size={16} />
              <span>{error.submit}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-wrapper">
              <User size={20} className="input-icon" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={errors.name ? 'error' : ''}
              />
            </div>
            {errors.name && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

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
                placeholder="Create a strong password"
                className={errors.password ? 'error' : ''}
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
            {formData.password && !errors.password && (
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={formData.password.length >= 8 ? 'met' : ''}>
                    At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                    One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                    One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.password) ? 'met' : ''}>
                    One number
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{errors.confirmPassword}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="auth-submit-btn"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <button
            className="auth-link"
            onClick={onNavigateToSignIn}
          >
            Sign In
          </button>
        </p>

        <p className="privacy-note">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SignUp;