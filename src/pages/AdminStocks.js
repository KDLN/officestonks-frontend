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
      await adminUpdateStock(editingStock.id, {
        symbol: formData.symbol,
        name: formData.name,
        current_price: parseFloat(formData.current_price),
        description: formData.description,
        sector: formData.sector,
        volume: parseInt(formData.volume, 10)
      });
      
      setMessage('Stock updated successfully');
      setShowModal(false);
      fetchStocks(); // Refresh stock list
    } catch (err) {
      setError(`Failed to update stock: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle create form submission
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await adminCreateStock({
        symbol: formData.symbol,
        name: formData.name,
        current_price: parseFloat(formData.current_price),
        description: formData.description,
        sector: formData.sector,
        volume: parseInt(formData.volume, 10)
      });
      
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
      console.log('Admin Stocks UI: Calling resetStockPrices()');
      const result = await resetStockPrices();
      console.log('Admin Stocks UI: resetStockPrices result:', result);
      
      if (result && result.error) {
        setError(result.message || 'Failed to reset stock prices');
      } else {
        setMessage(result?.message || 'Stock prices have been reset successfully.');
        // Refresh the stock list to show updated prices
        fetchStocks();
      }
    } catch (err) {
      console.error('Admin Stocks UI: Reset prices error:', err);
      setError(`Failed to reset stock prices: ${err.message}`);
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
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="admin-actions" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button 
            className="admin-button create-button"
            onClick={handleCreateClick}
            style={{ flex: '1', minWidth: '150px' }}
          >
            Create New Stock
          </button>
          
          <button 
            className="admin-button warning"
            onClick={handleResetPrices}
            disabled={loading}
            style={{ flex: '1', minWidth: '150px', backgroundColor: '#e67e22' }}
          >
            {loading ? 'Processing...' : 'Reset All Prices'}
          </button>
        </div>

        {loading && !stocks.length ? (
          <p>Loading stocks...</p>
        ) : (
          <div className="stock-list">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th>Current Price</th>
                  <th>Sector</th>
                  <th>Volume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => (
                  <tr key={stock.id}>
                    <td>{stock.id}</td>
                    <td>{stock.symbol}</td>
                    <td>{stock.name}</td>
                    <td>${stock.current_price.toFixed(2)}</td>
                    <td>{stock.sector || '-'}</td>
                    <td>{stock.volume ? stock.volume.toLocaleString() : '-'}</td>
                    <td className="action-buttons">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(stock)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteClick(stock)}
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