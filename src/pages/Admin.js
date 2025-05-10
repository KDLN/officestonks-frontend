import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Admin.css';
import { resetStockPrices, clearAllChats } from '../services/admin';

const Admin = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset stock prices
  const handleResetStocks = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await resetStockPrices();
      setMessage('Stock prices have been reset successfully.');
    } catch (err) {
      setError(`Failed to reset stock prices: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Clear all chat messages
  const handleClearChats = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      await clearAllChats();
      setMessage('All chat messages have been cleared successfully.');
    } catch (err) {
      setError(`Failed to clear chat messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <Navigation />
      <div className="admin-container">
        <h1>Admin Dashboard</h1>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="admin-actions">
          <div className="admin-card">
            <h2>User Management</h2>
            <p>View, edit, and delete user accounts</p>
            <Link to="/admin/users" className="admin-button">
              Manage Users
            </Link>
          </div>
          
          <div className="admin-card">
            <h2>Stock Management</h2>
            <p>Reset all stock prices to their initial values</p>
            <button 
              className="admin-button danger"
              onClick={handleResetStocks}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reset Stock Prices'}
            </button>
          </div>
          
          <div className="admin-card">
            <h2>Chat Management</h2>
            <p>Clear all chat messages from the system</p>
            <button 
              className="admin-button danger"
              onClick={handleClearChats}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Clear All Chats'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;