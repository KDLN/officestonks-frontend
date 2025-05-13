/**
 * Centralized API configuration for the application
 * This file provides consistent API URLs and settings across the application
 */

// Detect if we're running in localhost
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Primary backend API URL pointing directly to backend - hardcoded to fix deployment issues
export const BACKEND_URL = 'https://officestonks-proxy-production.up.railway.app';

// API route base - Define without trailing slash to ensure predictable path construction
export const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;

// Debug API URL construction
console.log('API URL constructed:', API_URL);

// CORS proxy configuration - used for admin functionality
export const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://officestonks-proxy-production.up.railway.app';

// WebSocket URL - use the CORS proxy explicitly
export const WS_URL = CORS_PROXY_URL.replace(/^http/, 'ws') + '/ws';

// Log configuration
console.log('API Config:', {
  isLocalhost,
  BACKEND_URL,
  API_URL,
  CORS_PROXY_URL,
  WS_URL
});

// Default request configuration
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// Export API endpoints for consistency
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',

  // User endpoints
  USER_PROFILE: 'users/me',
  LEADERBOARD: 'users/leaderboard',

  // Stock endpoints
  STOCKS: 'stocks',
  STOCK_DETAIL: (id) => `stocks/${id}`,
  PORTFOLIO: 'portfolio',
  TRADING: 'trading',
  TRANSACTIONS: 'transactions',

  // Admin endpoints (already using relative paths which will be prefixed with API_URL)
  ADMIN_STATUS: 'admin/status',
  ADMIN_USERS: 'admin/users',
  ADMIN_USER: (id) => `admin/users/${id}`,
  ADMIN_STOCKS_RESET: 'admin/stocks/reset',
  ADMIN_CHAT_CLEAR: 'admin/chat/clear',

  // Chat endpoints
  CHAT_MESSAGES: 'chat/messages',
  CHAT_SEND: 'chat/send',

  // Health check endpoints
  API_HEALTH: 'health',
  WS_HEALTH: 'ws/health'
};

// API helper for making requests
export const api = {
  get: async (url, options = {}) => {
    try {
      const headers = {
        ...DEFAULT_HEADERS,
        ...options.headers
      };

      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.startsWith('http') ? url : `${API_URL}/${url.replace(/^\//, '')}`, {
        method: 'GET',
        headers,
        ...options,
        credentials: options.credentials || 'include'
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API GET Error for ${url}:`, error);
      throw error;
    }
  },

  post: async (url, data, options = {}) => {
    try {
      const headers = {
        ...DEFAULT_HEADERS,
        ...options.headers
      };

      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.startsWith('http') ? url : `${API_URL}/${url.replace(/^\//, '')}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        ...options,
        credentials: options.credentials || 'include'
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API POST Error for ${url}:`, error);
      throw error;
    }
  },

  put: async (url, data, options = {}) => {
    try {
      const headers = {
        ...DEFAULT_HEADERS,
        ...options.headers
      };

      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.startsWith('http') ? url : `${API_URL}/${url.replace(/^\//, '')}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options,
        credentials: options.credentials || 'include'
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API PUT Error for ${url}:`, error);
      throw error;
    }
  },

  delete: async (url, options = {}) => {
    try {
      const headers = {
        ...DEFAULT_HEADERS,
        ...options.headers
      };

      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url.startsWith('http') ? url : `${API_URL}/${url.replace(/^\//, '')}`, {
        method: 'DELETE',
        headers,
        ...options,
        credentials: options.credentials || 'include'
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API DELETE Error for ${url}:`, error);
      throw error;
    }
  }
};