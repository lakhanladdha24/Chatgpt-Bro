import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './Chat';
import Sidebar from './Sidebar';
import Auth from './Auth';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to closed on mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


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
        if (isMobile) setIsSidebarOpen(false);
    };

    const handleNewChat = () => {
        setCurrentChatId(null);
        if (isMobile) setIsSidebarOpen(false);
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
                                        {isSidebarOpen ? '✕' : '☰'}
                                    </button>
                                    {isMobile && isSidebarOpen && (
                                        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
                                    )}
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
