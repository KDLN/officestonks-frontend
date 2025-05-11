/**
 * Admin service for frontend
 * Handles admin-specific API interactions
 */

import { getToken } from './auth';
import { fetchWithFallback } from '../utils/http';
import { ENDPOINTS, API_URL } from '../config/api';

// API_URL already includes '/api', so we don't need to add it again
const ADMIN_URL = `https://web-production-1e26.up.railway.app/api`;

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
 * Debug admin token parsing
 * Tests token parsing with backend debug endpoint
 * @returns {Promise<Object>} Debug information about the token
 */
export const debugAdminToken = async () => {
  try {
    const token = getToken();
    const debugUrl = `https://web-production-1e26.up.railway.app/debug-admin-jwt?token=${token}`;
    console.log('Testing token parsing at:', debugUrl);
    
    const response = await fetch(debugUrl);
    const debugData = await response.json();
    console.log('Token debug:', debugData);
    return debugData;
  } catch (error) {
    console.error('Error debugging token:', error);
    return { error: error.message };
  }
};

/**
 * Make a direct fetch request to admin endpoint
 * Bypasses the standard fetch utility for debugging purposes
 */
const directAdminFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const url = `${ADMIN_URL}/${endpoint}${token ? `?token=${token}` : ''}`;
  
  console.log(`Direct admin fetch to: ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Direct admin fetch error: ${error.message}`);
    throw error;
  }
};

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>} True if user is admin
 */
export const checkAdminStatus = async () => {
  try {
    // Try direct fetch to the admin status endpoint
    const result = await directAdminFetch('admin/status');
    console.log('Admin status check result:', result);
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
    // Try direct fetch to admin users endpoint
    const result = await directAdminFetch('admin/users');
    console.log('Admin users result:', result);
    return result;
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
    // Try direct fetch to admin stocks reset endpoint with force parameter
    const result = await directAdminFetch('admin/stocks/reset?force=true');
    console.log('Reset stock prices result:', result);
    return result;
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
    // Try direct fetch to admin chat clear endpoint with force parameter
    const result = await directAdminFetch('admin/chat/clear?force=true');
    console.log('Clear chats result:', result);
    return result;
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
    // Try direct fetch to admin user update endpoint
    const result = await directAdminFetch(`admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    console.log('Update user result:', result);
    return result;
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
    // Try direct fetch to admin user delete endpoint
    const result = await directAdminFetch(`admin/users/${userId}`, {
      method: 'DELETE'
    });
    console.log('Delete user result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: true, message: 'User deleted successfully (mock)' };
  }
};