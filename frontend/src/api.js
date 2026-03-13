// api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const registerUser = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to register');
    return res.json();
};

export const loginUser = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to login');
    return res.json();
};

export const fetchUserChats = async (userId) => {
    const res = await fetch(`${API_URL}/chat/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch chats');
    return res.json();
};

export const fetchChatHistory = async (chatId) => {
    const res = await fetch(`${API_URL}/chat/${chatId}`);
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
};

export const deleteChat = async (chatId) => {
    const res = await fetch(`${API_URL}/chat/${chatId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete chat');
    return res.json();
};

export const sendMessageStream = async (userId, message, chatId, onChunk, onDone, onError) => {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, message, chatId }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to communicate with server');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6);
                    if (!dataStr) continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.error) {
                            onError(new Error(data.error));
                        } else if (data.done) {
                            onDone(data.chatId);
                        } else if (data.text) {
                            onChunk(data.text);
                        }
                    } catch (e) {
                        console.error("Error parsing SSE JSON", e, dataStr);
                    }
                }
            }
        }
    } catch (error) {
        onError(error);
    }
};
