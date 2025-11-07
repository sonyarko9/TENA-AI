const API_BASE_URL = 'https://tena-api.onrender.com/api'; // for development we'll use 'http://localhost:5000/api';

export const api = {
    chat: async (message, sessionId = null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    session_id: sessionId
                }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Error calling chat API:', error);
            throw error;
        }
    }
};