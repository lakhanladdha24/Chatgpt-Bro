import React, { useEffect, useState } from 'react';
import { fetchUserChats, deleteChat } from './api';
import { Plus, MessageSquare, Trash2, LogOut } from 'lucide-react';

const Sidebar = ({ currentChatId, onSelectChat, onNewChat, onLogout }) => {
    const [chats, setChats] = useState([]);
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');

    const loadChats = async () => {
        if (!userId) return;
        try {
            const data = await fetchUserChats(userId);
            setChats(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    };

    useEffect(() => {
        loadChats();
    }, [userId, currentChatId]); // Reload when currentChatId changes (e.g. after a new chat gets its title and ID)

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteChat(id);
            if (currentChatId === id) {
                onNewChat();
            } else {
                loadChats();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <div className="sidebar">
            <button className="new-chat-btn" onClick={onNewChat}>
                <Plus size={18} /> New Chat
            </button>

            <div className="chat-list">
                {chats.map(chat => (
                    <div
                        key={chat._id}
                        className={`chat-list-item ${currentChatId === chat._id ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat._id)}
                    >
                        <MessageSquare size={16} />
                        <span className="chat-title" title={chat.title}>{chat.title}</span>
                        <button className="delete-btn" onClick={(e) => handleDelete(e, chat._id)}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="user-info">
                    {email}
                </div>
                <button className="logout-btn" onClick={onLogout}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
