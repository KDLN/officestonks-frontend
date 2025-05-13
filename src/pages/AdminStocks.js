import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import './Admin.css';
import { adminGetAllStocks, adminCreateStock, adminUpdateStock, adminDeleteStock, debugAdminToken } from '../services/admin';

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
      const data = await adminGetAllStocks();
      setStocks(data);
      setError('');
    } catch (err) {
      setError(`Failed to load stocks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load stocks and force live mode with special token
  useEffect(() => {
    fetchStocks();

    // Skip checking mock mode to avoid CORS issues
    setMockMode(false);
    console.log('Admin Stocks panel using special debug admin token - bypassing mock mode check');
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

  return (
    <div className="admin-page">
      <Navigation />
      <div className="admin-container">
        <h1>Stock Management</h1>

        <div className="debug-mode-banner">
          <p>🔧 Admin Debug Mode Enabled</p>
          <p>Using special admin token with local storage persistence.</p>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="admin-actions">
          <button 
            className="admin-button create-button"
            onClick={handleCreateClick}
          >
            Create New Stock
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