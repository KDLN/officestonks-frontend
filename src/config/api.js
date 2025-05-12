/**
 * Centralized API configuration for the application
 * This file provides consistent API URLs and settings across the application
 */

// Detect if we're running in localhost
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Primary backend API URL pointing directly to backend
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://web-production-1e26.up.railway.app';

// API route base
export const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;

// CORS proxy configuration (not used anymore - keeping for backward compatibility)
export const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://web-production-1e26.up.railway.app';

// WebSocket URL (converts HTTP to WS protocol)
export const WS_URL = API_URL.replace(/^http/, 'ws').replace('/api', '/ws');

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