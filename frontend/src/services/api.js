const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// switch between 'http://localhost:5000/api' in devlopment and 'https://tena-api.onrender.com/api' 

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