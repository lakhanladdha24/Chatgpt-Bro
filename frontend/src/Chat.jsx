import React, { useState, useEffect, useRef } from 'react';
import { fetchChatHistory, sendMessageStream } from './api';
import { Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chat = ({ currentChatId, onChatCreated }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        const loadChat = async () => {
            if (currentChatId) {
                try {
                    const data = await fetchChatHistory(currentChatId);
                    setMessages(data.messages.filter(m => m.role !== 'system'));
                } catch (error) {
                    console.error('Failed to load chat history', error);
                }
            } else {
                setMessages([
                    { role: 'model', content: "Sup bro! I'm ChatGPT Bro. How can I help you today?" }
                ]);
            }
        };
        loadChat();
    }, [currentChatId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleInput = (e) => {
        setInput(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = '48px';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '48px';
        }

        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        let streamingMessageIndex = messages.length + 1;
        setMessages((prev) => [...prev, { role: 'model', content: '' }]);

        let fullContent = '';

        try {
            await sendMessageStream(
                userId,
                userMsg,
                currentChatId,
                (chunkText) => {
                    fullContent += chunkText;
                    setMessages((prev) => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { role: 'model', content: fullContent };
                        return newMsgs;
                    });
                },
                (newChatId) => {
                    if (!currentChatId && newChatId) {
                        onChatCreated(newChatId);
                    }
                    setIsLoading(false);
                },
                (error) => {
                    console.error("Stream Error:", error);
                    setMessages((prev) => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { role: 'model', content: `Error: ${error.message}` };
                        return newMsgs;
                    });
                    setIsLoading(false);
                }
            );
        } catch (error) {
            console.error("Catch Error:", error);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-container-main">
            <div className="chat-window">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}
                    >
                        <div className="message-icon">
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className="message-content markdown-body">
                            {msg.role === 'user' ? (
                                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                            ) : (
                                <ReactMarkdown
                                    children={msg.content}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !inline && match ? (
                                                <SyntaxHighlighter
                                                    {...props}
                                                    children={String(children).replace(/\n$/, '')}
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                />
                                            ) : (
                                                <code {...props} className={className}>
                                                    {children}
                                                </code>
                                            )
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="loading-indicator">
                        <Bot size={20} />
                        <div style={{ display: 'flex', gap: '3px', marginLeft: '10px', alignItems: 'center', height: '100%' }}>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="input-container" onSubmit={handleSend}>
                <textarea
                    ref={textareaRef}
                    className="input-box"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message to ChatGPT Bro..."
                    rows="1"
                    style={{ resize: 'none', height: '48px', overflowY: 'auto' }}
                />
                <button
                    type="submit"
                    className="send-button"
                    disabled={!input.trim() || isLoading}
                    title="Send"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default Chat;
