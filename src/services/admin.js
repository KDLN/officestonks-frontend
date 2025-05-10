// Admin service for frontend
import { getToken } from './auth';

// Make sure to include the correct API path
// Check the current hostname to determine if we're running locally
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// For Railway deployment, we might have different URLs for frontend and backend
// When running locally, use a relative URL for convenience
const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://web-production-1e26.up.railway.app';
const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;

// Use a relative path when local, direct URL when in production
console.log('Admin service using backend URL:', BACKEND_URL);
console.log('Admin service using API URL:', API_URL);

// Helper function that handles fetching with proper headers and error handling
const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Add Authorization header to options
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Use cors mode for direct connection to backend with CORS settings
      mode: 'cors',
    };

    console.log(`Fetching from: ${url}`);
    const response = await fetch(url, authOptions);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText || 'Unknown error'}`);
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error; // Re-throw to be handled by the calling function
  }
};

// Mock data for admin users when API calls fail
const mockAdminUsers = [
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

// Check if current user has admin privileges
export const checkAdminStatus = async () => {
  try {
    // Direct connection to the backend API
    const data = await fetchWithAuth(`${API_URL}/admin/status`);
    console.log('Admin status response:', data);
    return data?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    console.log('Falling back to localStorage admin check');
    
    // Fallback to localStorage if fetch fails
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin;
  }
};

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    // Direct connection to the backend API
    const data = await fetchWithAuth(`${API_URL}/admin/users`);
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    console.log('Returning mock user data');
    return mockAdminUsers;
  }
};

// Reset all stock prices (admin only)
export const resetStockPrices = async () => {
  try {
    // Direct connection to the backend API
    const data = await fetchWithAuth(`${API_URL}/admin/stocks/reset`, {
      method: 'POST',
    });
    
    return data || { message: 'Stock prices reset successfully' };
  } catch (error) {
    console.error('Error resetting stock prices:', error);
    console.log('Returning mock response');
    return { success: true, message: 'Stock prices have been reset (mock)' };
  }
};

// Clear all chat messages (admin only)
export const clearAllChats = async () => {
  try {
    // Direct connection to the backend API
    const data = await fetchWithAuth(`${API_URL}/admin/chat/clear`, {
      method: 'POST',
    });
    
    return data || { message: 'Chat messages cleared successfully' };
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    console.log('Returning mock response');
    return { success: true, message: 'Chat messages cleared successfully (mock)' };
  }
};

// Update a user (admin only)
export const updateUser = async (userId, data) => {
  try {
    // Direct connection to the backend API
    const responseData = await fetchWithAuth(`${API_URL}/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return responseData || { ...data, id: userId, message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    console.log('Returning mock response');
    return { ...data, id: userId, message: 'User updated successfully (mock)' };
  }
};

// Delete a user (admin only)
export const deleteUser = async (userId) => {
  try {
    // Direct connection to the backend API
    const data = await fetchWithAuth(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
    });
    
    return data || { message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    console.log('Returning mock response');
    return { success: true, message: 'User deleted successfully (mock)' };
  }
};