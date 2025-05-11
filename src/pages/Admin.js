import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Admin.css';
import { resetStockPrices, clearAllChats, debugAdminToken } from '../services/admin';

const Admin = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  // Check if we're in mock mode on component mount
  useEffect(() => {
    const checkMockMode = async () => {
      try {
        const debugInfo = await debugAdminToken();
        const isMockMode = debugInfo?.mockMode === true;
        setMockMode(isMockMode);

        if (isMockMode) {
          console.log('Admin panel running in mock mode due to API connection issues');
        }
      } catch (error) {
        console.error('Error checking mock mode:', error);
        setMockMode(true); // Default to mock mode if check fails
      }
    };

    checkMockMode();
  }, []);

  // Reset stock prices
  const handleResetStocks = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('Admin UI: Calling resetStockPrices()');
      const result = await resetStockPrices();
      console.log('Admin UI: resetStockPrices result:', result);

      if (result && result.error) {
        setError(result.message || 'Failed to reset stock prices');
      } else {
        setMessage(result?.message || 'Stock prices have been reset successfully.');
      }
    } catch (err) {
      console.error('Admin UI: Reset stocks error:', err);
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
      console.log('Admin UI: Calling clearAllChats()');
      const result = await clearAllChats();
      console.log('Admin UI: clearAllChats result:', result);

      if (result && result.error) {
        setError(result.message || 'Failed to clear chat messages');
      } else {
        setMessage(result?.message || 'All chat messages have been cleared successfully.');
      }
    } catch (err) {
      console.error('Admin UI: Clear chats error:', err);
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

        {mockMode && (
          <div className="mock-mode-banner">
            <p>⚠️ Running in Mock Mode: Backend connection unavailable</p>
            <p>Changes will be stored locally but not sent to the server.</p>
          </div>
        )}

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