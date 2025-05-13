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

  // Force live mode with special token on component mount
  useEffect(() => {
    // Skip checking mock mode to avoid CORS issues
    setMockMode(false);
    console.log('Admin panel using special debug admin token - bypassing mock mode check');
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

        <div className="debug-mode-banner">
          <p>🔧 Admin Debug Mode Enabled</p>
          <p>Using special admin token with local storage persistence.</p>
        </div>

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
            <p>Create, update and manage all stocks in the system</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '10px' }}>
              <Link to="/admin/stocks" className="admin-button" style={{ marginBottom: '10px', backgroundColor: '#2ecc71', flex: '1', minWidth: '150px' }}>
                Manage Stocks
              </Link>
              <button 
                className="admin-button danger"
                onClick={handleResetStocks}
                disabled={loading}
                style={{ flex: '1', minWidth: '150px' }}
              >
                {loading ? 'Processing...' : 'Reset Stock Prices'}
              </button>
            </div>
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
          
          <div className="admin-card">
            <h2>System Tweaks</h2>
            <p>Configure system-wide settings like market event frequency</p>
            <Link to="/admin/system-tweaks" className="admin-button">
              System Configuration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;