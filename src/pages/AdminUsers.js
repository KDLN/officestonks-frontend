import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import './Admin.css';
import { getAllUsers, updateUser, deleteUser, debugAdminToken } from '../services/admin';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mockMode, setMockMode] = useState(false);
  
  // Edit user modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    cashBalance: 0,
    isAdmin: false
  });
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load users and force live mode with special token
  useEffect(() => {
    fetchUsers();

    // Skip checking mock mode to avoid CORS issues
    setMockMode(false);
    console.log('Admin Users panel using special debug admin token - bypassing mock mode check');
  }, []);

  // Handle opening edit modal
  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      cashBalance: user.cash_balance,
      isAdmin: user.is_admin
    });
    setShowModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateUser(editingUser.id, {
        username: formData.username,
        cash_balance: parseFloat(formData.cashBalance),
        is_admin: formData.isAdmin
      });
      
      setMessage('User updated successfully');
      setShowModal(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  // Confirm user deletion
  const confirmDelete = async () => {
    setLoading(true);
    
    try {
      await deleteUser(userToDelete.id);
      setMessage('User deleted successfully');
      setShowDeleteConfirm(false);
      fetchUsers(); // Refresh user list
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <Navigation />
      <div className="admin-container">
        <h1>User Management</h1>

        {mockMode && (
          <div className="mock-mode-banner">
            <p>⚠️ Running in Mock Mode: Backend connection unavailable</p>
            <p>Changes will be stored locally but not sent to the server.</p>
          </div>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        {loading && !users.length ? (
          <p>Loading users...</p>
        ) : (
          <div className="user-list">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Cash Balance</th>
                  <th>Admin</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>${user.cash_balance.toFixed(2)}</td>
                    <td>{user.is_admin ? 'Yes' : 'No'}</td>
                    <td>{new Date(user.created_at).toLocaleString()}</td>
                    <td className="action-buttons">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditClick(user)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteClick(user)}
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

      {/* Edit User Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Edit User</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cashBalance">Cash Balance</label>
                <input
                  type="number"
                  id="cashBalance"
                  name="cashBalance"
                  value={formData.cashBalance}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleInputChange}
                  />
                  Admin User
                </label>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Confirm Deletion</h2>
            <p>
              Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>?
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
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;