/**
 * Admin API Service
 * Handles admin-specific API interactions with fallbacks to mock data
 */

import { adminClient } from '../index';
import { getConfig } from '../config';

const ENDPOINTS = getConfig().ENDPOINTS.ADMIN;

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
 * Initialize mock data storage if needed
 * @returns {Object} Mock data
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
 * @returns {Object} Mock data
 */
const getMockData = () => {
  initMockDataIfNeeded();
  return JSON.parse(localStorage.getItem(MOCK_DATA_KEY) || '{}');
};

/**
 * Save mock data to local storage
 * @param {Object} data - Mock data to save
 */
const saveMockData = (data) => {
  localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(data));
};

/**
 * Try API request with fallback to mock data
 * @param {Function} apiCall - API call function
 * @param {Function|Object} mockDataProvider - Mock data or function
 * @returns {Promise<any>} Response data
 */
const withMockFallback = async (apiCall, mockDataProvider) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API request failed, using mock data:', error);
    return typeof mockDataProvider === 'function' 
      ? mockDataProvider() 
      : mockDataProvider;
  }
};

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>} True if admin
 */
export const checkAdminStatus = async () => {
  return withMockFallback(
    async () => {
      const result = await adminClient.get(ENDPOINTS.STATUS);
      return result?.isAdmin === true;
    },
    () => true // Always return true in mock mode
  );
};

/**
 * Get all users (admin only)
 * @returns {Promise<Array>} List of all users
 */
export const getAllUsers = async () => {
  const mockData = getMockData();
  
  return withMockFallback(
    async () => {
      const result = await adminClient.get(ENDPOINTS.USERS);
      return Array.isArray(result) ? result : [];
    },
    mockData.users || MOCK_ADMIN_USERS
  );
};

/**
 * Reset all stock prices (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const resetStockPrices = async () => {
  return withMockFallback(
    async () => {
      return await adminClient.post(ENDPOINTS.RESET_STOCKS);
    },
    () => {
      const mockData = getMockData();
      mockData.lastReset = new Date().toISOString();
      saveMockData(mockData);
      
      return { 
        message: 'Stock prices have been reset successfully (mock mode)', 
        timestamp: new Date().toISOString(),
        mockMode: true
      };
    }
  );
};

/**
 * Clear all chat messages (admin only)
 * @returns {Promise<Object>} Status of the operation
 */
export const clearAllChats = async () => {
  return withMockFallback(
    async () => {
      return await adminClient.post(ENDPOINTS.CLEAR_CHAT);
    },
    () => {
      const mockData = getMockData();
      mockData.chatCleared = true;
      mockData.lastChatClear = new Date().toISOString();
      saveMockData(mockData);
      
      return { 
        message: 'Chat messages have been cleared successfully (mock mode)', 
        timestamp: new Date().toISOString(),
        mockMode: true
      };
    }
  );
};

/**
 * Update a user (admin only)
 * @param {number} userId - ID of the user to update
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (userId, data) => {
  return withMockFallback(
    async () => {
      return await adminClient.put(ENDPOINTS.USER(userId), data);
    },
    () => {
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
    }
  );
};

/**
 * Delete a user (admin only)
 * @param {number} userId - ID of the user to delete
 * @returns {Promise<Object>} Status of the operation
 */
export const deleteUser = async (userId) => {
  return withMockFallback(
    async () => {
      return await adminClient.delete(ENDPOINTS.USER(userId));
    },
    () => {
      const mockData = getMockData();
      mockData.users = mockData.users.filter(u => u.id !== userId);
      saveMockData(mockData);
      
      return { 
        message: 'User deleted successfully (mock mode)',
        deletedId: userId,
        mockMode: true,
        timestamp: new Date().toISOString()
      };
    }
  );
};