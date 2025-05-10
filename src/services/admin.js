// Admin service for frontend
import { addAuthToRequest } from './auth';

// Make sure to include the correct API path
const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';
const API_URL = `${BASE_URL}/api`;
console.log("Admin service using API URL:", API_URL);

// Check if current user is an admin
export const checkAdminStatus = async () => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      return false; // Not an admin or error
    }

    const data = await response.json();
    return data.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update a user (admin only)
export const updateUser = async (userId, userData) => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete a user (admin only)
export const deleteUser = async (userId) => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete user');
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Reset stock prices (admin only)
export const resetStockPrices = async () => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/stocks/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to reset stock prices');
    }

    return await response.json();
  } catch (error) {
    console.error('Error resetting stock prices:', error);
    throw error;
  }
};

// Clear all chat messages (admin only)
export const clearAllChats = async () => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/admin/chat/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to clear chat messages');
    }

    return true;
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    throw error;
  }
};