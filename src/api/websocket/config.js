/**
 * @fileoverview WebSocket configuration
 * 
 * This file provides configuration settings for WebSocket connections.
 */

// Default WebSocket configuration
const defaultConfig = {
  // Base URL for WebSocket connection
  // Can be overridden with environment variables
  WS_BASE_URL: 'wss://officestonks-proxy-production.up.railway.app',
  
  // WebSocket endpoint path
  WS_PATH: '/ws',
  
  // Reconnection settings
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY_MS: 3000,
  RECONNECT_BACKOFF_FACTOR: 1.5,
  MAX_RECONNECT_DELAY_MS: 30000,
  
  // Connection settings
  CONNECTION_TIMEOUT_MS: 10000,
  
  // Message buffer size
  MESSAGE_BUFFER_SIZE: 100,
  
  // Logging
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV !== 'production',
};

/**
 * Loads WebSocket configuration from the environment
 * @returns {Object} Configuration object
 */
export const loadConfig = () => {
  // Start with default config
  const config = { ...defaultConfig };
  
  // Override with environment variables
  if (process.env.REACT_APP_WS_BASE_URL) {
    config.WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL;
  }
  
  if (process.env.REACT_APP_WS_PATH) {
    config.WS_PATH = process.env.REACT_APP_WS_PATH;
  }
  
  // Allow direct override via window.__WS_CONFIG for development
  if (typeof window !== 'undefined' && window.__WS_CONFIG) {
    Object.assign(config, window.__WS_CONFIG);
  }
  
  return config;
};

/**
 * Get the WebSocket URL with token
 * @param {string} token - Authentication token
 * @returns {string} Complete WebSocket URL
 */
export const getWebSocketUrl = (token) => {
  const config = loadConfig();
  return `${config.WS_BASE_URL}${config.WS_PATH}?token=${token}`;
};

/**
 * Get WebSocket configuration
 * @returns {Object} WebSocket configuration
 */
export const getConfig = () => {
  return loadConfig();
};

/**
 * Logging utility that respects configuration
 * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
 * @param {string} message - Log message
 * @param {Object} data - Additional data
 */
export const log = (level, message, data = null) => {
  const config = loadConfig();
  
  // Skip debug logs in production unless explicitly enabled
  if (level === 'debug' && !config.ENABLE_DEBUG_LOGGING) {
    return;
  }
  
  // Use appropriate console method
  const method = {
    debug: 'debug',
    info: 'info',
    warn: 'warn',
    error: 'error'
  }[level] || 'log';
  
  // Format log message
  const prefix = `[WebSocket ${level.toUpperCase()}]`;
  
  if (data) {
    console[method](prefix, message, data);
  } else {
    console[method](prefix, message);
  }
};