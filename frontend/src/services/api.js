const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FASTAPI_BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL

// Core Fetch Helper
// This function handles all network communication, automatically includes 
const fetchWithAuth = async (endpoint, options = {}) => {
    const defaultOptions = {
        method: 'GET',
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

// Function to perform a non-authenticated health check
const simpleFetch = async (url) => {
    try {
        const response = await fetch(url, { method: 'GET', cache: 'no-cache' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

export const api = {

    healthCheck: async () => {
        const flaskUrl = API_BASE_URL + '/health';
        const fastapiUrl = FASTAPI_BASE_URL + '/health';

        const flaskStatus = await simpleFetch(flaskUrl);
        const fastapiStatus = await simpleFetch(fastapiUrl);

        return {
            flask: {url: flaskUrl, status: flaskStatus},
            fastapi: {url: fastapiUrl, status: fastapiStatus}
        };
    },

    // --- CHAT FUNCTIONS ---
    
    chat: async (message, sessionId = null) => {
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
        return fetchWithAuth('/chat/history'); 
    },

    getMessagesBySessionId: async (sessionId) => {
        try {
            const data = await fetchWithAuth(`/chat/messages/${sessionId}`);
            return data && data.messages ? data.messages : [];

        } catch (error) {
            console.error("API error fetching messages:", error);
            return [];
        }     
    },

    // --- AUTH FUNCTIONS ---

    register: async (email, password, userName) => {
        return fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, user_name: userName })
        });
    },

    login: async (email, password) => {
        return fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    logout: async () => {
        // Returns a string/text on success
        await fetchWithAuth('/auth/logout', { method: 'POST' });
        return true;
    },

    status: async () => {
        return fetchWithAuth('/auth/status');
    },

    forgotPassword: async (email) => {
        return fetchWithAuth('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },

    resetPassword: async (token, newPassword) => {
        return fetchWithAuth('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, new_password: newPassword })
        });
    },

    // --- ADMIN FUNCTIONS ---

    getSystemMetrics: async () => {
        return fetchWithAuth('/admin/metrics/system');
    },

    getAllUsers: async () => {
        const data = await fetchWithAuth('/admin/users');
        return data.users;
    },

    deleteAllUsers: async () => {
        return fetchWithAuth('/admin/delete-all-users', { method: 'POST' });
    },
};