/**
 * API Configuration Module
 * Centralized API configuration for the application
 */

// Environment detection
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// Base URLs
const BACKEND_URL = 'https://officestonks-proxy-production.up.railway.app';
const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;
const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 
                       'https://officestonks-proxy-production.up.railway.app';
const WS_URL = CORS_PROXY_URL.replace(/^http/, 'ws') + '/ws';

// Default request configuration
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Request timeouts
const REQUEST_TIMEOUT = 30000; // 30 seconds

// API endpoints
const ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
  },
  
  // User endpoints
  USER: {
    PROFILE: 'users/me',
    LEADERBOARD: 'users/leaderboard',
  },
  
  // Stock endpoints
  STOCK: {
    LIST: 'stocks',
    DETAIL: (id) => `stocks/${id}`,
    PORTFOLIO: 'portfolio',
    TRADING: 'trading',
    TRANSACTIONS: 'transactions',
  },
  
  // Admin endpoints
  ADMIN: {
    STATUS: 'admin/status',
    USERS: 'admin/users',
    USER: (id) => `admin/users/${id}`,
    RESET_STOCKS: 'admin/stocks/reset',
    CLEAR_CHAT: 'admin/chat/clear',
  },
  
  // Chat endpoints
  CHAT: {
    MESSAGES: 'chat/messages',
    SEND: 'chat/send',
  },
  
  // Health check endpoints
  HEALTH: {
    API: 'health',
    WS: 'ws/health',
  },
};

/**
 * Get API configuration
 * @returns {Object} API configuration object
 */
export function getConfig() {
  // Create an immutable config object
  return Object.freeze({
    API_URL,
    BACKEND_URL,
    CORS_PROXY_URL,
    WS_URL,
    DEFAULT_HEADERS,
    REQUEST_TIMEOUT,
    ENDPOINTS,
    isLocalhost,
  });
}

// Export configuration object
export default getConfig;