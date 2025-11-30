import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import { 
    Table,
    Users, 
    MessageCircle, 
    History, 
    Gauge, 
    RefreshCw, 
    AlertTriangle,
    Loader2,
    LogOut,
} from 'lucide-react';
import { api } from '../services/api';

// Simple Card Component for Metrics
const MetricCard = ({ icon: Icon, title, value }) => (
    <div className="metric-card">
        <div className="icon-wrapper">
            <Icon size={24} />
        </div>
        <h3>{title}</h3>
        <p className="value">{value !== undefined ? value.toLocaleString() : '---'}</p>
    </div>
);


const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletionMessage, setDeletionMessage] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState([]);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const fetchMetrics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const metricsData = await api.getSystemMetrics(); 
            setMetrics(metricsData);

            const usersData = await api.getAllUsers();
            setUsers(usersData);
            
        } catch (err) {
            console.error("Error fetching admin metrics:", err);
            setError("Failed to load system metrics. Check the backend service.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);
    
    // --- Dashboard Actions ---

    const handleRefresh = () => {
        fetchMetrics();
    };

    const handleDeleteAllUsers = async () => {
        if (!window.confirm("🚨 ARE YOU ABSOLUTELY SURE? This action is IRREVERSIBLE and will DELETE ALL USERS, SESSIONS, and MESSAGES from the database. ID sequences will be reset.")) {
            return;
        }

        setIsDeleting(true);
        setDeletionMessage('Deleting data... Please wait.');
        try {
            // This now calls the backend function which performs TRUNCATE RESTART IDENTITY
            const response = await api.deleteAllUsers(); 
            
            setDeletionMessage(response.message || 'All data deleted successfully! Database reset complete.');
            // Refresh metrics after deletion to show zeros
            fetchMetrics(); 
        } catch (err) {
            console.error("Error deleting all users:", err);
            setDeletionMessage(`Deletion failed: ${err.message || 'An unexpected error occurred.'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to log out of the Admin Dashboard?")) {
            return;
        }

        await logout();
        navigate('/landing');
    };

    // --- Conditional Rendering ---
    
    if (isLoading) {
        // Use the dedicated loading-indicator class
        return (
            <div className="admin-dashboard loading-indicator">
                <Loader2 size={24} className="animate-spin" /> Loading System Metrics...
            </div>
        );
    }

    // Use the dedicated error-message class
    if (error) {
        return (
            <div className="admin-dashboard">
                <div className="error-message">
                    <AlertTriangle size={20} /> {error}
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header Section */}
            <header className="dashboard-header">
                <div className="header-title">
                    <h1><Gauge size={32} style={{marginRight: '1rem'}} /> System Health Overview</h1>
                    <p className="subtitle">Real-time metrics on application usage and core data integrity.</p>
                </div>
                
                <div>
                    <button 
                        className="cta-button" // Reuse a common button style for a professional look
                        onClick={handleRefresh} 
                        disabled={isLoading || isDeleting}
                        style={{marginTop: '1rem', marginBottom: '2rem'}}
                    >
                        <RefreshCw size={18} /> Refresh Data
                    </button>

                    {/* LOGOUT BUTTON */}
                    <button
                        className="cta-button logout-button"
                        onClick={handleLogout}
                        disabled={isDeleting}
                        >
                            <LogOut size={18} /> Logout
                    </button>
                </div>
            </header>

            {/* Metrics Section */}
            <h2>📊 Application Core Metrics</h2>
            <div className="metrics-grid">
                <MetricCard 
                    icon={Users} 
                    title="Total Registered Users" 
                    value={metrics.total_users} 
                />
                <MetricCard 
                    icon={History} 
                    title="Total Chat Sessions" 
                    value={metrics.total_sessions} 
                />
                <MetricCard 
                    icon={MessageCircle} 
                    title="Total Messages Sent" 
                    value={metrics.total_messages} 
                />
                {/* Add more metrics cards as needed */}
            </div>
            
            <hr style={{margin: '4rem 0'}} />

            {/* User Management Section */}
            <section className="user-management">
                <h2>👤 Registered Users ({users.length})</h2>
                <div className="user-list-card">
                    <Table size={24} style={{ marginBottom: '1rem' }} />
                    <div className="user-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td className={user.is_admin ? 'text-admin' : ''}>
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {users.length === 0 && <p className="no-data">No users registered yet.</p>}
                </div>
            </section>

            <hr style={{margin: '4rem 0'}} />

            {/* Admin Actions Section */}
            <section className="admin-actions">
                <h2>⚠️ Dangerous Admin Actions</h2>
                <div className="action-card">
                    <div className="text">
                        <h3>Database Wipe & Reset</h3>
                        <p>This action permanently deletes all users, chat sessions, and messages, and resets the database ID counters to 1. **Do not use in production!**</p>
                    </div>
                    <button 
                        className="delete-btn" 
                        onClick={handleDeleteAllUsers}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Processing...' : (<><AlertTriangle size={20} /> DELETE ALL DATA</>)}
                    </button>
                </div>

                {/* Status Message */}
                {deletionMessage && (
                    <div className={`deletion-status-box ${deletionMessage.includes('deleted') || deletionMessage.includes('success') ? 'success' : deletionMessage.includes('failed') ? 'error' : 'info'}`}>
                        {deletionMessage}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminDashboard;