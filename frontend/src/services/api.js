const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Core Fetch Helper
// This function handles all network communication, automatically includes 
// credentials (cookies) for session persistence, and centralizes error handling.
const fetchWithAuth = async (endpoint, options = {}) => {
    const defaultOptions = {
        method: 'GET',
        // CRUCIAL: Sends the session cookie for authentication checks
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Merge defaults with provided options
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        // Ensure headers are merged correctly
        headers: { ...defaultOptions.headers, ...options.headers },
    };

    // Remove Content-Type header if no body is provided (cleaner for GET requests)
    if (mergedOptions.method === 'GET' || mergedOptions.method === 'DELETE') {
         delete mergedOptions.headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);

    if (!response.ok) {
        // Try to parse a structured error message from the server response
        const errorText = await response.text();
        let errorMessage = `HTTP error! Status: ${response.status}`;
        try {
            const errorJson = JSON.parse(errorText);
            // Use the server's specific error message if available
            errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
            // Fallback to HTTP status if response is not JSON
        }
        throw new Error(errorMessage);
    }

    // Return JSON if available, otherwise return text (e.g., for logout success)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
};


export const api = {
    // --- CHAT FUNCTIONS ---

    chat: async (message, sessionId = null) => {
        // Uses fetchWithAuth (POST)
        const data = await fetchWithAuth('/chat', {
            method: 'POST',
            body: JSON.stringify({
                message,
                session_id: sessionId
            }),
        });
        return data;
    },

    getChatHistory: async () => {
        // Uses fetchWithAuth (GET)
        // Correct path is assumed to be /api/chat/history based on your backend
        return fetchWithAuth('/chat/history'); 
    },

    getMessagesBySessionId: async (sessionId) => {
        // Uses fetchWithAuth (GET)
        const data = await fetchWithAuth(`/chat/messages/${sessionId}`);
        // Assuming the backend returns an object like { messages: [...] }
        return data.messages || data; 
    },

    // --- AUTH FUNCTIONS ---

    register: async (email, password, userName) => {
        // Uses fetchWithAuth (POST)
        return fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, user_name: userName })
        });
    },

    login: async (email, password) => {
        // Uses fetchWithAuth (POST)
        return fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    logout: async () => {
        // Uses fetchWithAuth (POST)
        // Returns a string/text on success
        await fetchWithAuth('/auth/logout', { method: 'POST' });
        return true;
    },

    status: async () => {
        // Uses fetchWithAuth (GET)
        return fetchWithAuth('/auth/status');
    },

    forgotPassword: async (email) => {
        // Uses fetchWithAuth (POST)
        return fetchWithAuth('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    resetPassword: async (token, newPassword) => {
        // Uses fetchWithAuth (POST)
        return fetchWithAuth('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword })
        });
    },

    // --- ADMIN FUNCTIONS ---

    getSystemMetrics: async () => {
        // Uses fetchWithAuth (GET)
        return fetchWithAuth('/admin/metrics/system');
    },

    getAllUsers: async () => {
        // Uses fetchWithAuth (GET)
        // NOTE: Removed `axios` dependency for consistency.
        const data = await fetchWithAuth('/admin/users');
        return data.users;
    },

    deleteAllUsers: async () => {
        // Uses fetchWithAuth (POST)
        return fetchWithAuth('/admin/delete-all-users', { method: 'POST' });
    },
};