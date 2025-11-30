import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    // State to hold authentication info
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); 

    // Function to check the login status when the app loads
    const checkAuthStatus = async () => {
        try {
            const data = await api.status();
            
            if (data.isAuthenticated) {
                setIsAuthenticated(true);
                setUser({ email: data.email, userId: data.user_id });
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            // Server down or network error, treat as not authenticated
            console.error("Failed to check auth status:", error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Run status check on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Function to handle successful login from Sign In component
    const login = (userData) => {
        setIsAuthenticated(true);
        setUser(userData);
    };

    // Function to handle logout
    const logout = async () => {
        try {
            await api.logout();
            setIsAuthenticated(false);
            setUser(null);
            // Reload the page to reset all application state
            // window.location.reload(); 
        } catch (error) {
            console.error("Logout failed:", error);
            setIsAuthenticated(false);
            setUser(null);
        }
    };
    
    // The value provided to components that consume this context
    const value = {
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        isGuest,
        setIsGuest,
        isLoading,
        login,
        logout,
        checkAuthStatus, 
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};