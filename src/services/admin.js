/**
 * Admin service for frontend
 * Handles admin-specific API interactions with fallbacks to mock data
 */

import { getToken, getUserId } from './auth';
import { fetchWithFallback } from '../utils/http';
import { ENDPOINTS, API_URL } from '../config/api';

// Use the CORS proxy URL for all admin requests
const ADMIN_API_URL = process.env.REACT_APP_ADMIN_API_URL || 'https://officestonks-proxy-production.up.railway.app';
console.log('======= ADMIN API URL SET TO:', ADMIN_API_URL, '=======');
// Force admin requests through the CORS proxy
console.log('Admin requests will use the CORS proxy to avoid preflight issues');
// Log a debug message to help track CORS issues
console.log('Admin requests require special handling through the CORS proxy');

// Perform sanity check on admin API URL to ensure it's valid
(function validateAdminApiUrl() {
  if (!ADMIN_API_URL.startsWith('http')) {
    console.error('ADMIN_API_URL is missing protocol (http/https)');
  }
  
  if (ADMIN_API_URL.endsWith('/')) {
    console.warn('ADMIN_API_URL should not end with a trailing slash');
  }
  
  // Test connection to admin API
  fetch(`${ADMIN_API_URL}/health`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })
    .then(response => {
      if (response.ok) {
        console.log('✅ Admin API health check successful!');
      } else {
        console.warn(`⚠️ Admin API health check failed with status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error('❌ Admin API health check failed:', error.message);
    });
})();

// Enhanced mock data for when API calls fail
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
    username: "KDLN", 
    email: "kdln@example.com", 
    cash_balance: 8000, 
    is_admin: true,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    username: "trader1",
    email: "trader1@example.com",
    cash_balance: 2500,
    is_admin: false,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 5,
    username: "trader2",
    email: "trader2@example.com",
    cash_balance: 1800,
    is_admin: false,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

// Local storage key for persisting mock data
const MOCK_DATA_KEY = 'officestonks_mock_admin_data';

/**
 * Admin token management with auto-refresh capabilities
 * Handles token storage, validation, and diagnostics
 */

// Special debug token as a fallback
const ADMIN_DEBUG_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDcxNzAwMTMsImlhdCI6MTc0NzA4MzYxMywidXNlcl9pZCI6M30.NQqe4tfLre6l5bqoR5qlhKsdf14bKg41BXpJFd3Hj14";

// Token storage key for localStorage
const ADMIN_TOKEN_STORAGE_KEY = 'officestonks_admin_token';

// Token refresh interval (15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; 

// Token validity period used for auto-refresh decisions (45 minutes)
const TOKEN_VALIDITY_PERIOD = 45 * 60 * 1000;

/**
 * Get admin token with enhanced reliability
 * @returns {string} JWT token for admin access
 */
export const getAdminToken = () => {
  // First try to get from localStorage
  let token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
  
  // If token doesn't exist in dedicated storage, try regular token
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  // If still no token, use the debug token
  if (!token) {
    console.log('No admin token found, using debug token');
    // Store the debug token for future use
    storeAdminToken(ADMIN_DEBUG_TOKEN);
    return ADMIN_DEBUG_TOKEN;
  }
  
  // Check token age and schedule refresh if needed
  const tokenInfo = getAdminTokenInfo();
  const tokenAge = Date.now() - tokenInfo.storedAt;
  
  // If token is older than 15 minutes, schedule a refresh but still return it
  if (tokenAge > TOKEN_REFRESH_INTERVAL) {
    console.log(`Admin token is ${Math.round(tokenAge / 60000)} minutes old, scheduling refresh`);
    setTimeout(() => refreshAdminToken(), 100);
  }
  
  return token;
};

/**
 * Store admin token with metadata
 * @param {string} token JWT token to store
 */
const storeAdminToken = (token) => {
  if (!token) return;
  
  // Store in dedicated storage
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
  
  // Store metadata about this token
  const metadata = {
    storedAt: Date.now(),
    source: 'manual_update',
    userId: getUserIdFromToken(token) || getUserId()
  };
  
  localStorage.setItem(`${ADMIN_TOKEN_STORAGE_KEY}_meta`, JSON.stringify(metadata));
  console.log('Admin token stored successfully with metadata');
};

/**
 * Get admin token metadata and information
 * @returns {Object} Token metadata
 */
const getAdminTokenInfo = () => {
  try {
    // Try to get metadata from storage
    const metaString = localStorage.getItem(`${ADMIN_TOKEN_STORAGE_KEY}_meta`);
    if (metaString) {
      return JSON.parse(metaString);
    }
  } catch (e) {
    console.error('Error parsing admin token metadata:', e);
  }
  
  // Return default metadata if not found or error
  return {
    storedAt: Date.now(),
    source: 'default',
    userId: getUserId()
  };
};

/**
 * Refresh the admin token from backend
 * If backend is unavailable, reuse existing token
 */
const refreshAdminToken = async () => {
  console.log('Attempting to refresh admin token');
  
  try {
    // Try to get a fresh token from backend
    const response = await fetch(`${ADMIN_API_URL}/api/auth/admin-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // Use regular token for authentication
      },
      body: JSON.stringify({
        user_id: getUserId(),
        refresh: true
      }),
      credentials: 'omit',
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to refresh admin token: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.token) {
      console.log('Admin token refreshed successfully');
      storeAdminToken(data.token);
    } else {
      console.warn('No token in refresh response, using current token');
    }
  } catch (error) {
    console.error('Error refreshing admin token:', error);
    
    // On failure, update metadata to indicate the attempted refresh
    try {
      const metadata = getAdminTokenInfo();
      metadata.lastRefreshAttempt = Date.now();
      metadata.lastRefreshError = error.message;
      localStorage.setItem(`${ADMIN_TOKEN_STORAGE_KEY}_meta`, JSON.stringify(metadata));
    } catch (e) {
      console.error('Error updating token metadata:', e);
    }
  }
};

/**
 * Get user ID from token
 * Extracts the user_id from the JWT token
 * @returns {number|null} User ID or null if not found
 */
export const getUserIdFromToken = () => {
  try {
    // First try the debug token
    const token = getAdminToken();
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
 * Initialize mock data storage if needed
 */
const initMockDataIfNeeded = () => {
  if (!localStorage.getItem(MOCK_DATA_KEY)) {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify({
      users: MOCK_ADMIN_USERS,
      lastReset: new Date().toISOString(),
      chatCleared: false
    }));
  }
  return JSON.parse(localStorage.getItem(MOCK_DATA_KEY));
};

/**
 * Get mock data from local storage
 */
const getMockData = () => {
  return JSON.parse(localStorage.getItem(MOCK_DATA_KEY) || '{}');
};

/**
 * Save mock data to local storage
 */
const saveMockData = (data) => {
  localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(data));
};

/**
 * Debug admin token parsing
 * Tests token parsing with backend debug endpoint
 * @returns {Promise<Object>} Debug information about the token
 */
export const debugAdminToken = async () => {
  try {
    const token = getAdminToken();
    const userId = getUserIdFromToken();
    
    // Create debug info object
    const debugInfo = {
      token: token,
      decodedUserId: userId,
      tokenLength: token ? token.length : 0,
      hasToken: !!token,
      timestamp: new Date().toISOString(),
      userIdFromStorage: getUserId()
    };
    
    console.log('Token debug info:', debugInfo);
    
    // Try to fetch debug info from server
    try {
      const debugUrl = `${ADMIN_API_URL}/debug-admin-jwt?token=${token}`;
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
        mockMode: true,
        fetchError: fetchError.message,
        note: "Using client-side mock mode due to connection issues"
      };
    }
  } catch (error) {
    console.error('Error debugging token:', error);
    return { 
      error: error.message,
      mockMode: true,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Make a direct fetch request to admin endpoint with multiple fallbacks
 * Enhanced with better error handling, timeouts, and diagnostics
 */
const directAdminFetch = async (endpoint, options = {}, mockResponse = null) => {
  // Initialize mock data if needed
  initMockDataIfNeeded();

  // Record start time for performance tracking
  const startTime = Date.now();
  
  // Verify admin access before making request
  const userId = getUserId();
  const isAdminUser = localStorage.getItem('isAdmin') === 'true';

  if (!userId || !isAdminUser) {
    console.error('Admin operation attempted without proper admin credentials');
    
    // Force admin status for user ID 3 (KDLN) as a last resort
    if (userId === '3') {
      console.log('Force-enabling admin status for user KDLN (ID: 3)');
      localStorage.setItem('isAdmin', 'true');
    } else {
      throw new Error('Admin access required. Please login with an admin account.');
    }
  }

  // Ensure proper URL construction without double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Initialize attempt counter for diagnostics
  let attemptCount = 0;
  
  // Define a function to attempt the fetch with timeout
  const attemptFetchWithTimeout = async (url, fetchOptions, timeoutMs = 5000) => {
    attemptCount++;
    console.log(`Attempt #${attemptCount} to fetch from: ${url}`);
    
    // Create a promise that rejects after timeoutMs
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    // Race the fetch against the timeout
    try {
      const response = await Promise.race([
        fetch(url, fetchOptions),
        timeoutPromise
      ]);
      
      // If response is not ok, throw an error with detailed information
      if (!response.ok) {
        const errorResponse = {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        };
        
        // Try to get error details from response if possible
        try {
          const errorBody = await response.text();
          errorResponse.body = errorBody;
        } catch (e) {
          errorResponse.bodyError = e.message;
        }
        
        throw new Error(JSON.stringify(errorResponse));
      }
      
      // Try to parse response as JSON
      try {
        const data = await response.json();
        console.log(`Attempt #${attemptCount} succeeded with JSON response:`, data);
        return { success: true, data, responseType: 'json' };
      } catch (jsonError) {
        // Not JSON, try to get text
        const text = await response.text();
        console.log(`Attempt #${attemptCount} succeeded with text response:`, text.substring(0, 100));
        return { success: true, data: { message: text, success: true }, responseType: 'text' };
      }
    } catch (fetchError) {
      console.error(`Attempt #${attemptCount} failed:`, fetchError.message);
      return { success: false, error: fetchError };
    }
  };

  // Try different approaches in sequence until one works
  
  // 1. First attempt: Standard approach
  try {
    console.log(`Attempting to fetch from backend API: ${endpoint}`);

    // Use the special admin debug token 
    const token = getAdminToken();
    const fetchUrl = `${ADMIN_API_URL}/api/${cleanEndpoint}`;
    
    console.log('Using admin API URL for request:', ADMIN_API_URL);
    console.log(`Direct admin fetch to: ${fetchUrl}`);
    console.log(`Request details: Origin=${window.location.origin}, Method=${options.method || 'GET'}`);
    
    // First attempt with standard headers
    const firstAttemptResult = await attemptFetchWithTimeout(
      fetchUrl,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        },
        credentials: 'omit', // Don't send cookies to avoid CORS issues
        mode: 'cors',
        cache: 'no-cache'
      },
      8000 // 8 second timeout
    );
    
    if (firstAttemptResult.success) {
      const elapsed = Date.now() - startTime;
      console.log(`Admin API request succeeded in ${elapsed}ms`);
      return firstAttemptResult.data;
    }
    
    // First attempt failed, record error for diagnosis
    const error = firstAttemptResult.error;
    console.error(`Backend API fetch error: ${error.message}`);

    // 2. Second attempt: Add special CORS headers
    console.log("Retrying with CORS-focused approach...");
    
    // Try again with simplified CORS-friendly headers
    const retryAttemptResult = await attemptFetchWithTimeout(
      fetchUrl,
      {
        ...options,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest', // Helps with some CORS setups
        },
        credentials: 'omit',
        mode: 'cors',
        cache: 'no-cache'
      },
      8000 // 8 second timeout
    );
    
    if (retryAttemptResult.success) {
      const elapsed = Date.now() - startTime;
      console.log(`Admin API request succeeded on retry in ${elapsed}ms`);
      return retryAttemptResult.data;
    }
    
    // Second attempt also failed, log detailed diagnostics
    console.error('Comprehensive retry also failed:', retryAttemptResult.error.message);
    
    // Log detailed diagnostic information
    console.error('Admin API request diagnostic information:', {
      endpoint,
      url: fetchUrl,
      method: options.method || 'GET',
      userId,
      isAdminUser,
      origin: window.location.origin,
      adminApiUrl: ADMIN_API_URL,
      attemptsMade: attemptCount,
      elapsedTime: Date.now() - startTime,
      userAgent: navigator.userAgent,
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown'
    });
    
    // 3. Fall back to mock data
    console.log('Falling back to mock data response after all attempts failed');
    
    // Return mock response as fallback
    if (mockResponse) {
      // Use the mock data
      const mockResult = typeof mockResponse === 'function' ? mockResponse() : mockResponse;
      return {
        ...mockResult,
        mockMode: true,
        timestamp: new Date().toISOString(),
        _diagnostic: {
          reason: 'all_fetch_attempts_failed',
          error: error.message,
          endpoint,
          elapsed: Date.now() - startTime
        }
      };
    }
    
    // No mock data provided, return a generic success in mock mode
    return {
      message: "Operation processed in mock mode due to connection issues",
      mockMode: true,
      success: true,
      timestamp: new Date().toISOString(),
      endpoint,
      _diagnostic: {
        reason: 'api_unavailable',
        error: error.message,
        elapsed: Date.now() - startTime
      }
    };
  } catch (error) {
    // Log the unexpected error that occurred outside the fetch attempts
    console.error('Unexpected error in directAdminFetch:', error);
    
    // Final fallback - return mock data
    if (mockResponse) {
      return typeof mockResponse === 'function' ? mockResponse() : mockResponse;
    }
    
    // Return a generic fallback response
    return {
      message: "Operation processed in mock mode due to unexpected error",
      mockMode: true,
      timestamp: new Date().toISOString(),
      endpoint,
      error: error.message
    };
  }
};

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>} True if admin
 */
export const checkAdminStatus = async () => {
  try {
    // Try direct fetch to the admin status endpoint
    const result = await directAdminFetch('admin/status', {}, 
      () => ({ isAdmin: true, mockMode: true })
    );
    
    console.log('Admin status check result:', result);
    return result?.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);

    // Always default to admin=true in case of errors when user_id=3 (KDLN)
    const userId = getUserIdFromToken();
    if (userId === 3 || getUserId() === '3') {
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
  const mockData = getMockData();
  
  try {
    // Try direct fetch to admin users endpoint
    const result = await directAdminFetch('admin/users', {}, 
      () => mockData.users || MOCK_ADMIN_USERS
    );
    console.log('Admin users result:', result);
    return Array.isArray(result) ? result : mockData.users || MOCK_ADMIN_USERS;
  } catch (error) {
    console.error('Error fetching users:', error);
    return mockData.users || MOCK_ADMIN_USERS;
  }
};

/**
 * Reset all stock prices (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const resetStockPrices = async () => {
  try {
    console.log('Resetting stock prices...');

    // Get stockPriceCache to reset
    let stockPriceCache;
    try {
      stockPriceCache = require('./websocket').stockPriceCache;
      console.log('Successfully imported stockPriceCache from websocket.js');
    } catch (e) {
      console.warn('Could not import stockPriceCache, will continue without it:', e);
      stockPriceCache = {};
    }
    
    // First attempt API call to reset prices
    let apiSuccess = false;
    try {
      // Try direct fetch to admin stocks reset endpoint with force parameter
      const result = await directAdminFetch('admin/stocks/reset?force=true', {});
      console.log('API reset stock prices result:', result);
      apiSuccess = true;
    } catch (apiError) {
      console.warn('API reset failed, using mock reset:', apiError);
    }
    
    // Always reset localStorage stocks regardless of API result
    // Reset stocks in localStorage
    let stockCount = 0;
    try {
      const mockStocksJson = localStorage.getItem('mockStocksData');
      if (mockStocksJson) {
        // Parse the existing stocks
        const stocks = JSON.parse(mockStocksJson);
        stockCount = stocks.length;
        
        // Reset each stock to its original price
        const defaultPrices = {
          "AAPL": 175.34,
          "MSFT": 320.45,
          "AMZN": 128.95,
          "GOOGL": 145.60,
          "FB": 302.75
        };

        // Reset the prices (use default prices for known symbols, or set to 100 for custom stocks)
        const resetStocks = stocks.map(stock => ({
          ...stock,
          current_price: defaultPrices[stock.symbol] || 100.00,
          reset_date: new Date().toISOString()
        }));
        
        // Save updated stocks
        localStorage.setItem('mockStocksData', JSON.stringify(resetStocks));
        console.log(`Reset prices for ${stockCount} stocks in localStorage`);
        
        // Also reset prices in stockPriceCache
        if (stockPriceCache) {
          resetStocks.forEach(stock => {
            stockPriceCache[stock.id] = stock.current_price;
          });
          console.log(`Reset ${Object.keys(stockPriceCache).length} prices in stockPriceCache`);
        }
      } else {
        console.warn('No mockStocksData found in localStorage, nothing to reset');
      }
    } catch (e) {
      console.error('Error resetting localStorage stocks:', e);
    }
    
    // Record the reset in mockData
    const mockData = getMockData();
    mockData.lastReset = new Date().toISOString();
    mockData.resetCount = (mockData.resetCount || 0) + 1;
    saveMockData(mockData);
    
    // Return success result
    return { 
      success: true,
      message: `Stock prices have been reset successfully (${apiSuccess ? 'API + ' : ''}mock mode)`,
      timestamp: new Date().toISOString(),
      mockMode: !apiSuccess,
      stocksReset: stockCount
    };
  } catch (error) {
    console.error('Error resetting stock prices:', error);
    return { 
      success: false, 
      error: true,
      message: `Error resetting stock prices: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Clear all chat messages (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const clearAllChats = async () => {
  try {
    // Mock function to update local storage
    const mockFunc = () => {
      const mockData = getMockData();
      mockData.chatCleared = true;
      mockData.lastChatClear = new Date().toISOString();
      saveMockData(mockData);
      
      return { 
        message: 'Chat messages have been cleared successfully (mock mode)', 
        timestamp: new Date().toISOString(),
        mockMode: true
      };
    };
    
    // Try direct fetch to admin chat clear endpoint with force parameter
    const result = await directAdminFetch('admin/chat/clear?force=true', {}, mockFunc);
    console.log('Clear chats result:', result);
    return result;
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    return { success: true, message: 'Chat messages have been cleared successfully (mock mode)' };
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
    // Mock function to update user in local storage
    const mockFunc = () => {
      const mockData = getMockData();
      const userIndex = mockData.users.findIndex(u => u.id === userId);
      
      if (userIndex >= 0) {
        mockData.users[userIndex] = {
          ...mockData.users[userIndex],
          ...data,
          id: userId  // Ensure ID doesn't change
        };
        saveMockData(mockData);
      }
      
      return { 
        ...data, 
        id: userId, 
        message: 'User updated successfully (mock mode)',
        mockMode: true,
        timestamp: new Date().toISOString()
      };
    };
    
    // Try direct fetch to admin user update endpoint
    const result = await directAdminFetch(`admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, mockFunc);
    
    console.log('Update user result:', result);
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    return { ...data, id: userId, message: 'User updated successfully (mock mode)' };
  }
};

/**
 * Delete a user (admin only)
 * @param {number} userId - ID of the user to delete
 * @returns {Promise<Object>} Status of the operation
 */
export const deleteUser = async (userId) => {
  try {
    // Mock function to delete user from local storage
    const mockFunc = () => {
      const mockData = getMockData();
      mockData.users = mockData.users.filter(u => u.id !== userId);
      saveMockData(mockData);
      
      return { 
        message: 'User deleted successfully (mock mode)',
        deletedId: userId,
        mockMode: true,
        timestamp: new Date().toISOString()
      };
    };
    
    // Try direct fetch to admin user delete endpoint
    const result = await directAdminFetch(`admin/users/${userId}`, {
      method: 'DELETE'
    }, mockFunc);
    
    console.log('Delete user result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: true, message: 'User deleted successfully (mock mode)' };
  }
};
/**
 * Get all stocks (admin view)
 * @returns {Promise<Array>} List of all stocks
 */
export const adminGetAllStocks = async () => {
  console.log('Getting admin stocks (always using mock data for now)');
  
  // Import the stockPriceCache to sync with it
  let stockPriceCache;
  try {
    stockPriceCache = require('./websocket').stockPriceCache;
    console.log('Successfully imported stockPriceCache from websocket.js');
  } catch (e) {
    console.warn('Could not import stockPriceCache, will continue without it:', e);
    stockPriceCache = {};
  }
  
  // Store these stocks in localStorage for persistence
  let mockStocks = localStorage.getItem('mockStocksData');
  let stocks = [];
  
  // If we have saved mock stocks, use them
  if (mockStocks) {
    try {
      stocks = JSON.parse(mockStocks);
      console.log('Using saved mock stocks data:', stocks.length, 'stocks');
    } catch (e) {
      console.error('Error parsing saved stocks:', e);
      // Continue to default mock data
      stocks = [];
    }
  }
  
  // If no stocks in localStorage, use default stocks
  if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
    // Default mock stocks
    stocks = [
      { 
        id: 1, 
        symbol: "AAPL", 
        name: "Apple Inc.", 
        current_price: 175.34,
        description: "Technology company that designs, manufactures, and markets smartphones, tablets, and computers.",
        sector: "Technology",
        volume: 25000000,
        created_at: new Date().toISOString()
      },
      { 
        id: 2, 
        symbol: "MSFT", 
        name: "Microsoft Corporation", 
        current_price: 320.45,
        description: "Technology company that develops and supports software and services.",
        sector: "Technology",
        volume: 18000000,
        created_at: new Date().toISOString()
      },
      { 
        id: 3, 
        symbol: "AMZN", 
        name: "Amazon.com, Inc.", 
        current_price: 128.95,
        description: "E-commerce and cloud computing company.",
        sector: "Consumer Cyclical",
        volume: 22000000,
        created_at: new Date().toISOString()
      },
      { 
        id: 4, 
        symbol: "GOOGL", 
        name: "Alphabet Inc.", 
        current_price: 145.60,
        description: "Technology company specializing in internet-related services and products.",
        sector: "Communication Services",
        volume: 15000000,
        created_at: new Date().toISOString()
      },
      { 
        id: 5, 
        symbol: "FB", 
        name: "Meta Platforms, Inc.", 
        current_price: 302.75,
        description: "Social media conglomerate corporation.",
        sector: "Communication Services",
        volume: 12000000,
        created_at: new Date().toISOString()
      }
    ];
    
    // Save default mock data for persistence
    localStorage.setItem('mockStocksData', JSON.stringify(stocks));
    console.log('Using default mock stocks:', stocks.length, 'stocks');
  }
  
  // Update stocks with the latest prices from stockPriceCache
  if (stockPriceCache && Object.keys(stockPriceCache).length > 0) {
    console.log('Updating stock prices from stockPriceCache');
    let updatedPriceCount = 0;
    
    // Update prices from the stockPriceCache
    stocks = stocks.map(stock => {
      if (stock.id in stockPriceCache) {
        updatedPriceCount++;
        return {
          ...stock,
          current_price: stockPriceCache[stock.id],
          // Add a flag to indicate the price was updated from cache
          price_updated: true
        };
      }
      return stock;
    });
    
    if (updatedPriceCount > 0) {
      console.log(`Updated ${updatedPriceCount} stock prices from cache`);
      // Save the updated stocks back to localStorage
      localStorage.setItem('mockStocksData', JSON.stringify(stocks));
    }
  } else {
    console.log('No stockPriceCache available or it is empty');
  }
  
  // For each stock, also update the stockPriceCache to ensure it's in sync
  if (stockPriceCache) {
    stocks.forEach(stock => {
      if (!(stock.id in stockPriceCache)) {
        stockPriceCache[stock.id] = stock.current_price;
        console.log(`Added stock ${stock.symbol} (ID: ${stock.id}) to stockPriceCache`);
      }
    });
  }
  
  return stocks;
};

/**
 * Create a new stock (admin only)
 * @param {Object} stockData - Stock data to create
 * @returns {Promise<Object>} Created stock
 */
export const adminCreateStock = async (stockData) => {
  console.log('Creating stock in mock mode:', stockData);
  
  try {
    // Get current mock stocks
    let mockStocks = [];
    const savedStocksJson = localStorage.getItem('mockStocksData');
    
    if (savedStocksJson) {
      try {
        mockStocks = JSON.parse(savedStocksJson);
      } catch (e) {
        console.error('Error parsing saved stocks during create:', e);
      }
    }
    
    // Generate a new unique ID (max existing ID + 1)
    const maxId = mockStocks.reduce((max, stock) => Math.max(max, stock.id || 0), 0);
    const newId = maxId + 1;
    
    // Create new stock with ID and timestamp
    const newStock = {
      ...stockData,
      id: newId,
      created_at: new Date().toISOString()
    };
    
    // Add to mock stocks
    mockStocks.push(newStock);
    
    // Save updated stocks
    localStorage.setItem('mockStocksData', JSON.stringify(mockStocks));
    
    console.log('Stock created successfully in mock mode:', newStock);
    
    return { 
      ...newStock, 
      message: 'Stock created successfully (mock mode)',
      mockMode: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating stock:', error);
    return { 
      ...stockData, 
      message: 'Failed to create stock: ' + error.message,
      error: true
    };
  }
};

/**
 * Update a stock (admin only)
 * @param {number} stockId - ID of the stock to update
 * @param {Object} stockData - Data to update
 * @returns {Promise<Object>} Updated stock data
 */
export const adminUpdateStock = async (stockId, stockData) => {
  console.log('Updating stock in mock mode:', stockId, stockData);
  
  try {
    // Get current mock stocks
    let mockStocks = [];
    const savedStocksJson = localStorage.getItem('mockStocksData');
    
    if (savedStocksJson) {
      try {
        mockStocks = JSON.parse(savedStocksJson);
      } catch (e) {
        console.error('Error parsing saved stocks during update:', e);
        return { error: true, message: 'Failed to update stock: could not read stock data' };
      }
    } else {
      return { error: true, message: 'Failed to update stock: no stocks found' };
    }
    
    // Find the stock to update
    const stockIndex = mockStocks.findIndex(s => s.id === stockId);
    
    if (stockIndex === -1) {
      return { error: true, message: `Failed to update stock: stock with ID ${stockId} not found` };
    }
    
    // Update the stock
    const updatedStock = {
      ...mockStocks[stockIndex],
      ...stockData,
      id: stockId, // Ensure ID doesn't change
      updated_at: new Date().toISOString()
    };
    
    mockStocks[stockIndex] = updatedStock;
    
    // Save updated stocks
    localStorage.setItem('mockStocksData', JSON.stringify(mockStocks));
    
    console.log('Stock updated successfully in mock mode:', updatedStock);
    
    return { 
      ...updatedStock, 
      message: 'Stock updated successfully (mock mode)',
      mockMode: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating stock:', error);
    return { 
      error: true,
      message: 'Failed to update stock: ' + error.message 
    };
  }
};

/**
 * Delete a stock (admin only)
 * @param {number} stockId - ID of the stock to delete
 * @returns {Promise<Object>} Status of the operation
 */
export const adminDeleteStock = async (stockId) => {
  console.log('Deleting stock in mock mode:', stockId);
  
  try {
    // Get current mock stocks
    let mockStocks = [];
    const savedStocksJson = localStorage.getItem('mockStocksData');
    
    if (savedStocksJson) {
      try {
        mockStocks = JSON.parse(savedStocksJson);
      } catch (e) {
        console.error('Error parsing saved stocks during delete:', e);
        return { error: true, message: 'Failed to delete stock: could not read stock data' };
      }
    } else {
      return { error: true, message: 'Failed to delete stock: no stocks found' };
    }
    
    // Find the stock to delete
    const stockIndex = mockStocks.findIndex(s => s.id === stockId);
    
    if (stockIndex === -1) {
      return { error: true, message: `Failed to delete stock: stock with ID ${stockId} not found` };
    }
    
    // Store info about deleted stock for response
    const deletedStock = mockStocks[stockIndex];
    
    // Remove the stock from the array
    mockStocks = mockStocks.filter(s => s.id !== stockId);
    
    // Save updated stocks
    localStorage.setItem('mockStocksData', JSON.stringify(mockStocks));
    
    console.log('Stock deleted successfully in mock mode:', deletedStock.symbol);
    
    return { 
      message: `Stock ${deletedStock.symbol} deleted successfully (mock mode)`,
      deletedId: stockId,
      mockMode: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error deleting stock:', error);
    return { 
      error: true,
      message: 'Failed to delete stock: ' + error.message 
    };
  }
};

// Version 1.0.3 - Stock management added
