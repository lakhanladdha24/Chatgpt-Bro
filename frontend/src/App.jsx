import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './Chat';
import Sidebar from './Sidebar';
import Auth from './Auth';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        setIsAuthenticated(false);
        setCurrentChatId(null);
    };

    const handleSelectChat = (chatId) => {
        setCurrentChatId(chatId);
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
    };

    const handleChatCreated = (newChatId) => {
        setCurrentChatId(newChatId);
    };

    return (
        <Router>
            <div className="app-container">
                <Routes>
                    <Route
                        path="/login"
                        element={isAuthenticated ? <Navigate to="/" /> : <Auth setIsAuthenticated={setIsAuthenticated} />}
                    />
                    <Route
                        path="/"
                        element={
                            isAuthenticated ? (
                                <div className="layout">
                                    <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                                        ☰
                                    </button>
                                    <div className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}>
                                        <Sidebar
                                            currentChatId={currentChatId}
                                            onSelectChat={handleSelectChat}
                                            onNewChat={handleNewChat}
                                            onLogout={handleLogout}
                                        />
                                    </div>
                                    <div className="main-content">
                                        <div className="header">
                                            ChatGPT Bro 🤖
                                        </div>
                                        <Chat currentChatId={currentChatId} onChatCreated={handleChatCreated} />
                                    </div>
                                </div>
                            ) : (
                                <Navigate to="/login" />
                            )
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
