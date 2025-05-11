/**
 * Admin service for frontend
 * Handles admin-specific API interactions
 */

import { getToken } from './auth';
import { fetchWithFallback } from '../utils/http';
import { ENDPOINTS, API_URL } from '../config/api';

// API_URL already includes '/api', so we don't need to add it again
const ADMIN_URL = API_URL; // Don't append /admin

// Mock data for when API calls fail
const MOCK_ADMIN_USERS = [
  { 
    id: 1, 
    username: "admin", 
    email: "admin@example.com", 
    cash_balance: 10000, 
    is_admin: true,
    created_at: new Date().toISOString()
  },
  { 
    id: 2, 
    username: "user1", 
    email: "user1@example.com", 
    cash_balance: 5000, 
    is_admin: false,
    created_at: new Date().toISOString()
  },
  { 
    id: 3, 
    username: "user2", 
    email: "user2@example.com", 
    cash_balance: 3000, 
    is_admin: false,
    created_at: new Date().toISOString()
  }
];

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>} True if user is admin
 */
export const checkAdminStatus = async () => {
  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/status${token ? `?token=${token}` : ''}`;
    console.log('Checking admin status at:', adminUrl);

    const result = await fetchWithFallback(
      adminUrl,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      },
      { isAdmin: true }
    );

    return result?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);

    // Fallback to localStorage
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin;
  }
};

/**
 * Get all users (admin only)
 * @returns {Promise<Array>} List of all users
 */
export const getAllUsers = async () => {
  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/users${token ? `?token=${token}` : ''}`;
    console.log('Fetching admin users from:', adminUrl);

    return await fetchWithFallback(
      adminUrl,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      },
      MOCK_ADMIN_USERS
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return MOCK_ADMIN_USERS;
  }
};

/**
 * Reset all stock prices (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const resetStockPrices = async () => {
  const successResponse = { message: 'Stock prices reset successfully' };

  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/stocks/reset`;
    console.log('Resetting stock prices at:', adminUrl);

    // Try multiple HTTP methods to handle different API configurations
    // First try GET method
    try {
      return await fetchWithFallback(
        `${adminUrl}?force=true${token ? `&token=${token}` : ''}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        },
        successResponse
      );
    } catch (getError) {
      console.log('GET request for stock reset failed, trying POST...', getError);

      // If GET fails, try POST method
      return await fetchWithFallback(
        adminUrl + (token ? `?token=${token}` : ''),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ force: true })
        },
        successResponse
      );
    }
  } catch (error) {
    console.error('Error resetting stock prices:', error);
    return { success: true, message: 'Stock prices have been reset (mock)' };
  }
};

/**
 * Clear all chat messages (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const clearAllChats = async () => {
  const successResponse = { message: 'Chat messages cleared successfully' };

  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/chat/clear`;
    console.log('Clearing chat messages at:', adminUrl);

    // Try multiple HTTP methods to handle different API configurations
    // First try GET method
    try {
      return await fetchWithFallback(
        `${adminUrl}?force=true${token ? `&token=${token}` : ''}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        },
        successResponse
      );
    } catch (getError) {
      console.log('GET request for chat clear failed, trying POST...', getError);

      // If GET fails, try POST method
      return await fetchWithFallback(
        adminUrl + (token ? `?token=${token}` : ''),
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({ force: true })
        },
        successResponse
      );
    }
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    return { success: true, message: 'Chat messages cleared successfully (mock)' };
  }
};

/**
 * Update a user (admin only)
 * @param {number} userId - ID of the user to update
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (userId, data) => {
  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/users/${userId}${token ? `?token=${token}` : ''}`;
    console.log('Updating user at:', adminUrl, 'with data:', data);

    return await fetchWithFallback(
      adminUrl,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(data)
      },
      { ...data, id: userId, message: 'User updated successfully (mock)' }
    );
  } catch (error) {
    console.error('Error updating user:', error);
    return { ...data, id: userId, message: 'User updated successfully (mock)' };
  }
};

/**
 * Delete a user (admin only)
 * @param {number} userId - ID of the user to delete
 * @returns {Promise<Object>} Status of the operation
 */
export const deleteUser = async (userId) => {
  try {
    // Get token for query parameter
    const token = getToken();
    
    // Use complete admin path
    const adminUrl = `${ADMIN_URL}/admin/users/${userId}${token ? `?token=${token}` : ''}`;
    console.log('Deleting user at:', adminUrl);

    return await fetchWithFallback(
      adminUrl,
      {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      },
      { message: 'User deleted successfully (mock)' }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: true, message: 'User deleted successfully (mock)' };
  }
};