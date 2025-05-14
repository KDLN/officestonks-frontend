import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Admin.css';
import { 
  adminGetAllStocks, 
  adminCreateStock, 
  adminUpdateStock, 
  adminDeleteStock, 
  resetStockPrices,
  debugAdminToken 
} from '../services/admin';
import {
  pauseStockUpdates,
  resumeStockUpdates,
  setStockPrice,
  pauseAllStockUpdates,
  resumeAllStockUpdates
} from '../services/websocket';

const AdminStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mockMode, setMockMode] = useState(false);
  
  // Edit stock modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    current_price: 0,
    description: '',
    sector: '',
    volume: 0
  });
  
  // Create stock modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);

  // Fetch all stocks
  const fetchStocks = async () => {
    setLoading(true);
    try {
      console.log('Fetching admin stock list...');
      
      // Force admin status for user ID 3 (KDLN)
      const userId = localStorage.getItem('userId');
      if (userId === '3') {
        localStorage.setItem('isAdmin', 'true');
        console.log('Forced admin status for user KDLN (ID: 3)');
      }
      
      const data = await adminGetAllStocks();
      
      // Log the response for debugging
      console.log('Admin stocks data received:', data);
      
      // Fallback to empty array if data is invalid
      if (!Array.isArray(data)) {
        console.warn('Expected array of stocks but got:', typeof data);
        setStocks([]);
        setError('Received invalid data format from server. Using empty stock list.');
        return;
      }
      
      setStocks(data);
      setError('');
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError(`Failed to load stocks: ${err.message || 'Unknown error'}`);
      
      // Set empty array for stocks to avoid null reference errors
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Load stocks and force live mode with special token
  useEffect(() => {
    console.log('==== AdminStocks component mounted ====');
    
    // Log navigation information if available
    try {
      const navInfo = localStorage.getItem('lastStocksNavigation');
      if (navInfo) {
        const parsed = JSON.parse(navInfo);
        console.log('Navigation info:', parsed);
        // Calculate time since navigation
        const navTime = new Date(parsed.timestamp);
        const elapsed = new Date() - navTime;
        console.log(`Time since navigation: ${elapsed}ms`);
      }
    } catch (e) {
      console.error('Error parsing navigation info:', e);
    }
    
    // Add navigation guard to prevent redirects
    const loadData = async () => {
      try {
        console.log('AdminStocks - Starting to load data');
        
        // Make sure user is admin before proceeding
        const isAdminUser = localStorage.getItem('isAdmin') === 'true';
        const userId = localStorage.getItem('userId');
        console.log('Auth check:', { isAdminUser, userId });
        
        if (!isAdminUser && userId !== '3') {
          console.error('Non-admin user attempted to access admin stocks page');
          return;
        }
        
        // Force admin for user ID 3 (KDLN)
        if (userId === '3') {
          localStorage.setItem('isAdmin', 'true');
          console.log('Force-enabled admin for user KDLN');
        }
        
        // Proceed with data loading
        console.log('AdminStocks - Fetching stock data');
        await fetchStocks();
        
        // Skip checking mock mode to avoid CORS issues
        setMockMode(false);
        console.log('Admin Stocks panel using special debug admin token - bypassing mock mode check');
      } catch (err) {
        console.error('Error initializing AdminStocks page:', err);
        setError('Failed to load admin stocks page. Please try again.');
      }
    };
    
    loadData();
    
    // Add a route change handler to log when we leave this route
    return () => {
      console.log('==== AdminStocks component unmounted ====');
    };
  }, []);

  // Handle opening edit modal
  const handleEditClick = (stock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      current_price: stock.current_price,
      description: stock.description || '',
      sector: stock.sector || '',
      volume: stock.volume || 0
    });
    setShowModal(true);
  };

  // Handle opening create modal
  const handleCreateClick = () => {
    setFormData({
      symbol: '',
      name: '',
      current_price: 100.00,
      description: '',
      sector: '',
      volume: 1000000
    });
    setShowCreateModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Pause WebSocket updates for this specific stock while updating
      const stockId = editingStock.id;
      console.log(`Pausing WebSocket updates for stock ID: ${stockId} during edit`);
      pauseStockUpdates(stockId);
      
      const newPrice = parseFloat(formData.current_price);
      
      // Update the stock in the database/localStorage
      await adminUpdateStock(stockId, {
        symbol: formData.symbol,
        name: formData.name,
        current_price: newPrice,
        description: formData.description,
        sector: formData.sector,
        volume: parseInt(formData.volume, 10)
      });
      
      // Manually update the price in the WebSocket cache
      console.log(`Manually updating stock price for ID: ${stockId} to ${newPrice}`);
      setStockPrice(stockId, newPrice);
      
      // Resume WebSocket updates for this stock after a short delay
      setTimeout(() => {
        console.log(`Resuming WebSocket updates for stock ID: ${stockId} after edit`);
        resumeStockUpdates(stockId);
        
        // Dispatch a custom event for components to know stock was updated
        document.dispatchEvent(new CustomEvent('stock-edit-complete', {
          detail: {
            stockId,
            newPrice,
            timestamp: new Date().toISOString()
          }
        }));
      }, 1000); // Use a longer delay to allow UI to update
      
      setMessage('Stock updated successfully');
      setShowModal(false);
      fetchStocks(); // Refresh stock list
    } catch (err) {
      setError(`Failed to update stock: ${err.message}`);
      
      // Make sure to resume stock updates even if there was an error
      console.log(`Resuming WebSocket updates for stock ID: ${editingStock.id} after error`);
      resumeStockUpdates(editingStock.id);
    } finally {
      setLoading(false);
    }
  };

  // Handle create form submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const initialPrice = parseFloat(formData.current_price);
      
      // Create the stock in the database/localStorage
      const newStock = await adminCreateStock({
        symbol: formData.symbol,
        name: formData.name,
        current_price: initialPrice,
        description: formData.description,
        sector: formData.sector,
        volume: parseInt(formData.volume, 10)
      });
      
      // If we got the ID of the new stock, set its price in the WebSocket cache
      if (newStock && newStock.id) {
        console.log(`Setting initial price for new stock ID: ${newStock.id} to ${initialPrice}`);
        setStockPrice(newStock.id, initialPrice);
          
        // Dispatch a custom event for components to know a new stock was created
        document.dispatchEvent(new CustomEvent('stock-created', {
          detail: {
            stockId: newStock.id,
            symbol: formData.symbol,
            price: initialPrice,
            timestamp: new Date().toISOString()
          }
        }));
      }
      
      setMessage('Stock created successfully');
      setShowCreateModal(false);
      fetchStocks(); // Refresh stock list
    } catch (err) {
      setError(`Failed to create stock: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (stock) => {
    setStockToDelete(stock);
    setShowDeleteConfirm(true);
  };

  // Confirm stock deletion
  const confirmDelete = async () => {
    setLoading(true);
    
    try {
      await adminDeleteStock(stockToDelete.id);
      setMessage('Stock deleted successfully');
      setShowDeleteConfirm(false);
      fetchStocks(); // Refresh stock list
    } catch (err) {
      setError(`Failed to delete stock: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reset stock prices
  const handleResetPrices = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // First, pause all WebSocket updates to prevent flickering during reset
      console.log('Admin Stocks UI: Pausing all WebSocket stock updates before reset');
      pauseAllStockUpdates();
      
      console.log('Admin Stocks UI: Calling resetStockPrices()');
      const result = await resetStockPrices();
      console.log('Admin Stocks UI: resetStockPrices result:', result);
      
      if (result && result.error) {
        setError(result.message || 'Failed to reset stock prices');
      } else {
        setMessage(result?.message || 'Stock prices have been reset successfully.');
        
        // Add a special class to highlight reset stocks when they come back
        const stockRows = document.querySelectorAll('.stock-table tbody tr');
        stockRows.forEach(row => {
          row.classList.add('reset-highlight');
        });
        
        // Refresh the stock list to show updated prices after a delay
        setTimeout(() => {
          fetchStocks();
          
          // After another delay, resume WebSocket updates
          setTimeout(() => {
            console.log('Admin Stocks UI: Resuming WebSocket updates after reset complete');
            resumeAllStockUpdates();
            
            // Remove the highlight class after a few seconds
            setTimeout(() => {
              const stockRows = document.querySelectorAll('.stock-table tbody tr');
              stockRows.forEach(row => {
                row.classList.remove('reset-highlight');
              });
            }, 3000);
          }, 1000);
        }, 1000);
      }
    } catch (err) {
      console.error('Admin Stocks UI: Reset prices error:', err);
      setError(`Failed to reset stock prices: ${err.message}`);
      
      // Always make sure to resume WebSocket updates if there's an error
      console.log('Admin Stocks UI: Resuming WebSocket updates after error');
      resumeAllStockUpdates();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <Navigation />
      <div className="admin-container">
        <h1>Stock Management</h1>
        
        <div className="admin-navigation">
          <Link to="/admin" className="admin-nav-button">
            ← Back to Admin Dashboard
          </Link>
        </div>

        <div className="debug-mode-banner">
          <p>🔧 Admin Debug Mode Enabled</p>
          <p>Using special admin token with local storage persistence.</p>
          {/* Admin status indicator */}
          <div style={{ 
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <div style={{ 
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: localStorage.getItem('isAdmin') === 'true' ? '#2ecc71' : '#e74c3c',
              display: 'inline-block'
            }}></div>
            <span style={{ fontWeight: 'bold' }}>
              Admin Status: {localStorage.getItem('isAdmin') === 'true' ? 'Active' : 'Inactive'}
            </span>
            <span style={{ fontSize: '12px', color: '#777' }}>
              User ID: {localStorage.getItem('userId') || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Enhanced message display with auto-dismiss */}
        {message && (
          <div className="success-message" style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <div>
              <strong>Success! </strong> 
              {message}
            </div>
            <button 
              onClick={() => setMessage('')} 
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                padding: '0 5px'
              }}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Enhanced error display with details and dismissal */}
        {error && (
          <div className="error-message" style={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '12px 20px',
            backgroundColor: '#f8d7da',
            borderColor: '#f5c6cb',
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Error: </strong> 
                {error}
              </div>
              <button 
                onClick={() => setError('')} 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '0 5px'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ 
              marginTop: '10px',
              fontSize: '12px',
              color: '#721c24',
              textAlign: 'right'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginRight: '10px',
                  fontSize: '12px'
                }}
              >
                Reload Page
              </button>
              <span>
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
        
        <div className="admin-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button 
            className="admin-button create-button"
            onClick={handleCreateClick}
            style={{ 
              flex: '1', 
              minWidth: '150px',
              background: 'linear-gradient(to right, #2ecc71, #27ae60)',
              color: 'white',
              border: 'none',
              padding: '12px 15px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ marginRight: '5px' }}>+</span> Create New Stock
          </button>
          
          <button 
            className="admin-button warning"
            onClick={handleResetPrices}
            disabled={loading}
            style={{ 
              flex: '1', 
              minWidth: '150px', 
              background: loading ? '#bdc3c7' : 'linear-gradient(to right, #e67e22, #d35400)',
              color: 'white',
              border: 'none',
              padding: '12px 15px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? (
              <span>
                <span style={{ display: 'inline-block', animation: 'rotation 1s infinite linear' }}>⟳</span> Processing...
              </span>
            ) : (
              'Reset All Prices'
            )}
          </button>
        </div>

        {loading && !stocks.length ? (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '15px'
            }}></div>
            <p style={{ fontSize: '18px', color: '#666' }}>Loading stocks...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes rotation {
                from { transform: rotate(0deg); }
                to { transform: rotate(359deg); }
              }
            `}</style>
          </div>
        ) : (
          <div className="stock-list">
            <table className="stock-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Symbol</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Current Price</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Sector</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Volume</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => (
                  <tr 
                    key={stock.id}
                    style={{ 
                      backgroundColor: stock.price_updated ? '#f0fff4' : 'white',
                      transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = stock.price_updated ? '#f0fff4' : 'white'}
                  >
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd' }}>{stock.id}</td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>{stock.symbol}</td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd' }}>{stock.name}</td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', textAlign: 'right', color: stock.price_updated ? '#27ae60' : 'inherit' }}>
                      ${stock.current_price.toFixed(2)}
                      {stock.price_updated && <span style={{ marginLeft: '5px', fontSize: '10px' }}>✓</span>}
                    </td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd' }}>{stock.sector || '-'}</td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                      {stock.volume ? stock.volume.toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '12px 15px', borderBottom: '1px solid #ddd', textAlign: 'center' }} className="action-buttons">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(stock)}
                        style={{
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          marginRight: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteClick(stock)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Stock Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit Stock</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="symbol">Symbol</label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="current_price">Current Price</label>
                <input
                  type="number"
                  id="current_price"
                  name="current_price"
                  value={formData.current_price}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="sector">Sector</label>
                <input
                  type="text"
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="volume">Volume</label>
                <input
                  type="number"
                  id="volume"
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Stock Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Create New Stock</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label htmlFor="symbol">Symbol</label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. AAPL"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Apple Inc."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="current_price">Initial Price ($)</label>
                <input
                  type="number"
                  id="current_price"
                  name="current_price"
                  value={formData.current_price}
                  onChange={handleInputChange}
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the company"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sector">Sector</label>
                <input
                  type="text"
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleInputChange}
                  placeholder="e.g. Technology"
                />
              </div>

              <div className="form-group">
                <label htmlFor="volume">Volume</label>
                <input
                  type="number"
                  id="volume"
                  name="volume"
                  value={formData.volume}
                  onChange={handleInputChange}
                  min="0"
                  step="1"
                  placeholder="e.g. 1000000"
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the stock <strong>{stockToDelete?.symbol} ({stockToDelete?.name})</strong>?
              This action cannot be undone.
            </p>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStocks;