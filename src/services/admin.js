// Admin service for frontend
import { getToken, addAuthToRequest } from './auth';
import { createDirectUrl, getProxyConfig } from './corsProxy';

// Make sure to include the correct API path
// Check the current hostname to determine if we're running locally
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Configuration - we'll use the same approach as other services
// Get the configuration from corsProxy to ensure consistent behavior
const config = getProxyConfig();

// For Railway deployment, we might have different URLs for frontend and backend
// When running locally, use a relative URL for convenience
const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-production-1e26.up.railway.app';
const API_URL = isLocalhost ? '/api' : `${BASE_URL}/api`;

// Define CORS proxy URL if we need to use it
const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://officestonks-cors-proxy.up.railway.app';

// Use a relative path when local, direct URL when in production
// This approach should be consistent with the rest of the application
console.log('Admin service using API URL:', API_URL);

// Check if current user has admin privileges
export const checkAdminStatus = async () => {
  try {
    // Prepare request config with auth - consistent with other services
    const { url, options } = addAuthToRequest(`${API_URL}/admin/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Checking admin status at URL:', url);

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      console.log('Admin status response not OK:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('Admin status response:', data);
    return data.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available for authentication');
      return [];
    }

    // Use CORS proxy instead of direct API call
    const requestUrl = `${CORS_PROXY_URL}/admin/users?token=${token}`;
    console.log('Getting all users from URL (via CORS proxy):', requestUrl);

    // Make the request - now using proper CORS mode since backend has been fixed
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Failed to fetch users: ${response.status} ${statusText}`);
      return []; // Return empty array instead of throwing to prevent UI errors
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from server for getAllUsers');
      return [];
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text was:', text);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    // Return empty array instead of re-throwing to prevent UI errors
    return [];
  }
};

// Reset all stock prices (admin only)
export const resetStockPrices = async () => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available for authentication');
      return { error: true, message: 'No authentication token available. Please log in again.' };
    }

    // Use CORS proxy instead of direct API call
    const requestUrl = `${CORS_PROXY_URL}/admin/stocks/reset?token=${token}`;
    console.log('Resetting stock prices with URL (via CORS proxy):', requestUrl);

    // Make the request - now using proper CORS mode since backend has been fixed
    const response = await fetch(requestUrl, {
      method: 'POST', // Use POST as specified in the original implementation
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });
    
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Failed to reset stock prices: ${response.status} ${statusText}`);
      return { error: true, message: 'Failed to reset stock prices. Please try again.' };
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from server for resetStockPrices');
      return { message: 'Stock prices reset successfully' };
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text was:', text);
      // Return a default response so the UI can continue
      return { message: 'Stock prices reset successfully (response parse error)' };
    }
  } catch (error) {
    console.error('Error resetting stock prices:', error);
    // Return a user-friendly error message instead of throwing
    return { error: true, message: 'Failed to reset stock prices. Please try again.' };
  }
};

// Clear all chat messages (admin only)
export const clearAllChats = async () => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available for authentication');
      return { error: true, message: 'No authentication token available. Please log in again.' };
    }

    // Use CORS proxy instead of direct API call
    const requestUrl = `${CORS_PROXY_URL}/admin/chat/clear?token=${token}`;
    console.log('Clearing chat messages with URL (via CORS proxy):', requestUrl);

    // Make the request - now using proper CORS mode since backend has been fixed
    const response = await fetch(requestUrl, {
      method: 'POST', // Use POST as specified in the original implementation
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Failed to clear chat messages: ${response.status} ${statusText}`);
      return { error: true, message: 'Failed to clear chat messages. Please try again.' };
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from server for clearAllChats');
      return { message: 'Chat messages cleared successfully' };
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text was:', text);
      // Return a default response so the UI can continue
      return { message: 'Chat messages cleared successfully (response parse error)' };
    }
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    // Return a user-friendly error message instead of throwing
    return { error: true, message: 'Failed to clear chat messages. Please try again.' };
  }
};

// Update a user (admin only)
export const updateUser = async (userId, data) => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available for authentication');
      return { error: true, ...data, id: userId, message: 'No authentication token available. Please log in again.' };
    }

    // Use CORS proxy instead of direct API call
    const requestUrl = `${CORS_PROXY_URL}/admin/users/${userId}?token=${token}`;
    console.log('Updating user with URL (via CORS proxy):', requestUrl);

    // Make the request - now using proper CORS mode since backend has been fixed
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Failed to update user: ${response.status} ${statusText}`);
      return { error: true, ...data, id: userId, message: 'Failed to update user. Please try again.' };
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from server for updateUser');
      return { ...data, id: userId, message: 'User updated successfully' };
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text was:', text);
      // Return a default response so the UI can continue
      return { ...data, id: userId, message: 'User updated successfully (response parse error)' };
    }
  } catch (error) {
    console.error('Error updating user:', error);
    // Return a user-friendly error message instead of throwing
    return { error: true, ...data, id: userId, message: 'Failed to update user. Please try again.' };
  }
};

// Delete a user (admin only)
export const deleteUser = async (userId) => {
  try {
    const token = getToken();
    if (!token) {
      console.error('No token available for authentication');
      return { error: true, message: 'No authentication token available. Please log in again.' };
    }

    // Use CORS proxy instead of direct API call
    const requestUrl = `${CORS_PROXY_URL}/admin/users/${userId}?token=${token}`;
    console.log('Deleting user with URL (via CORS proxy):', requestUrl);

    const response = await fetch(requestUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    if (!response.ok) {
      const statusText = response.statusText || 'Unknown error';
      console.error(`Failed to delete user: ${response.status} ${statusText}`);
      return { error: true, message: 'Failed to delete user. Please try again.' };
    }

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn('Empty response from server for deleteUser');
      return { message: 'User deleted successfully' };
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      console.error('Response text was:', text);
      // Return a default response so the UI can continue
      return { message: 'User deleted successfully (response parse error)' };
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    // Return a user-friendly error message instead of throwing
    return { error: true, message: 'Failed to delete user. Please try again.' };
  }
};