const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');
const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key_for_build');

const SYSTEM_PROMPT = `You are ChatGPT Bro, an advanced AI assistant.
You give structured, accurate, professional answers.
You help students, developers, and job seekers.
You explain clearly with examples when needed.
Format your responses using Markdown.`;

// Basic web search simulation
const simulateWebSearch = (query) => {
    return `[Simulated Web Search] Results for "${query}": The most relevant information is that ChatGPT Bro is highly effective at simulating searches!`;
};

// Basic calculator function
const calculate = (expression) => {
    try {
        const result = eval(expression.replace(/[^0-9+\-*/().]/g, ''));
        return `[Calculator Tool] Result: ${result}`;
    } catch (err) {
        return "[Calculator Tool] Error: Invalid calculation.";
    }
};

// Get all chat sessions for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.params.userId }).select('_id title createdAt').sort({ createdAt: -1 });
        res.json(chats);
    } catch (error) {
        console.error("Fetch Chats Error:", error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

// Get a specific chat by ID
router.get('/:chatId', async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ error: 'Chat not found' });
        res.json(chat);
    } catch (error) {
        console.error("Fetch Chat Error:", error);
        res.status(500).json({ error: 'Failed to fetch chat' });
    }
});

// DELETE a chat session
router.delete('/:chatId', async (req, res) => {
    try {
        await Chat.findByIdAndDelete(req.params.chatId);
        res.json({ message: 'Chat deleted correctly' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Create new chat or add message to existing chat, streaming the response
router.post('/', async (req, res) => {
    try {
        const { userId, chatId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: 'userId and message are required' });
        }

        let chat;
        if (chatId) {
            chat = await Chat.findById(chatId);
            if (!chat) {
                return res.status(404).json({ error: 'Chat not found' });
            }
        } else {
            // Generate a title based on the first message natively or use the message itself
            const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
            chat = new Chat({ userId, title, messages: [{ role: 'system', content: SYSTEM_PROMPT }] });
        }

        // User message format
        const newUserMessage = { role: 'user', content: message };
        chat.messages.push(newUserMessage);

        // Save immediately before hitting Gemini so that the chat is initialized with title & user message in DB
        // This ensures the sidebar updates even if Google Gemini API fails
        await chat.save();

        // Required headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullAiResponse = '';

        // 2. Tool detection
        const lowerMessage = message.toLowerCase();
        let usedTool = false;

        if (lowerMessage.includes('calculate')) {
            const calcQuery = lowerMessage.replace('calculate', '').trim();
            if (calcQuery) {
                fullAiResponse = calculate(calcQuery);
                usedTool = true;
            }
        } else if (lowerMessage.includes('search')) {
            const searchQuery = lowerMessage.replace('search', '').trim();
            if (searchQuery) {
                fullAiResponse = simulateWebSearch(searchQuery);
                usedTool = true;
            }
        }

        if (usedTool) {
            // Save model response in history
            const newModelMessage = { role: 'model', content: fullAiResponse };
            chat.messages.push(newModelMessage);
            await chat.save();

            // Send standard JSON response disguised as SSE stream end format, since tools are synchronous here
            res.write(`data: ${JSON.stringify({ text: fullAiResponse })}\n\n`);
            res.write(`data: ${JSON.stringify({ done: true, chatId: chat._id })}\n\n`);
            res.end();
            return;
        }

        // 3. Send full history to Gemini
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            res.write(`data: ${JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' })}\n\n`);
            res.end();
            return;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: SYSTEM_PROMPT });

        const history = chat.messages
            .filter(m => m.role !== 'system')
            .slice(0, -1) // all except the brand new user message
            .map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }));

        const chatSession = model.startChat({
            history: history,
        });

        const result = await chatSession.sendMessageStream(message);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullAiResponse += chunkText;
            res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        }

        // 4. Save model response in history
        const newModelMessage = { role: 'model', content: fullAiResponse };
        chat.messages.push(newModelMessage);

        await chat.save();

        res.write(`data: ${JSON.stringify({ done: true, chatId: chat._id })}\n\n`);
        res.end();

    } catch (error) {
        console.error("Chat Error:", error);
        res.write(`data: ${JSON.stringify({ error: 'Something went wrong processing your message.' })}\n\n`);
        res.end();
    }
});

module.exports = router;
