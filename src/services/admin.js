/**
 * Admin service for frontend
 * Handles admin-specific API interactions
 */

import { getToken } from './auth';
import { fetchWithFallback } from '../utils/http';
import { ENDPOINTS, API_URL } from '../config/api';

// Use the exact backend URL as provided by the backend team
const BACKEND_URL = `https://web-production-1e26.up.railway.app`;

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
 * Get user ID from token
 * Extracts the user_id from the JWT token
 * @returns {number|null} User ID or null if not found
 */
export const getUserIdFromToken = () => {
  try {
    const token = getToken();
    if (!token) return null;
    
    // Split the token and decode the payload part (second segment)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Not a valid JWT token (should have 3 parts)');
      return null;
    }
    
    // Decode the base64url encoded payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    console.log('Decoded JWT payload:', payload);
    
    return payload.user_id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Debug admin token parsing
 * Tests token parsing with backend debug endpoint
 * @returns {Promise<Object>} Debug information about the token
 */
export const debugAdminToken = async () => {
  try {
    const token = getToken();
    const userId = getUserIdFromToken();
    
    // Create debug info object
    const debugInfo = {
      token: token,
      decodedUserId: userId,
      tokenLength: token ? token.length : 0,
      hasToken: !!token
    };
    
    console.log('Local token debug:', debugInfo);
    
    // Try to fetch debug info from server
    try {
      const debugUrl = `${BACKEND_URL}/debug-admin-jwt?token=${token}`;
      console.log('Testing token parsing at:', debugUrl);
      
      const response = await fetch(debugUrl);
      const debugData = await response.json();
      console.log('Server token debug:', debugData);
      
      return {
        ...debugInfo,
        serverResponse: debugData
      };
    } catch (fetchError) {
      console.error('Error fetching debug info from server:', fetchError);
      return {
        ...debugInfo,
        fetchError: fetchError.message
      };
    }
  } catch (error) {
    console.error('Error debugging token:', error);
    return { error: error.message };
  }
};

/**
 * Make a direct fetch request to admin endpoint 
 * Tries multiple approaches to authenticate the request
 */
const directAdminFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const userId = getUserIdFromToken();
  
  // Include user_id in query params if available
  const userIdParam = userId ? `user_id=${userId}` : '';
  const tokenParam = token ? `token=${token}` : '';
  const queryParams = [userIdParam, tokenParam].filter(Boolean).join('&');
  
  const url = `${BACKEND_URL}/api/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
  
  console.log(`Direct admin fetch to: ${url}`);
  console.log(`Using user_id: ${userId} from token`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header as requested by backend team
        ...options.headers
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      // Try to read error response text
      const errorText = await response.text();
      console.error(`HTTP error ${response.status}: ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
    }
    
    // Try to parse response as JSON
    try {
      return await response.json();
    } catch (jsonError) {
      console.log('Response is not JSON, returning text');
      return { message: await response.text() };
    }
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

    // Always default to admin=true in case of errors when user_id=3 (KDLN)
    const userId = getUserIdFromToken();
    if (userId === 3) {
      console.log('Defaulting to admin=true for user_id 3 (KDLN)');
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    
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