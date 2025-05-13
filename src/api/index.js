/**
 * API Module Entry Point
 * Exports all API services and utilities
 */

import ApiClient from './client';
import { ApiError, AuthError } from './errors';
import { getConfig } from './config';
import * as stockApi from './services/stockApi';
import * as authApi from './services/authApi';
import * as userApi from './services/userApi';
import * as adminApi from './services/adminApi';
import * as chatApi from './services/chatApi';

/**
 * Get authentication token from localStorage
 * @returns {string|null} Authentication token or null
 */
const getAuthToken = () => localStorage.getItem('token');

// Initialize default API client
const defaultClient = new ApiClient({
  baseUrl: getConfig().API_URL,
  tokenProvider: getAuthToken,
});

// Initialize admin API client
const adminClient = new ApiClient({
  baseUrl: `${getConfig().CORS_PROXY_URL}/api`,
  tokenProvider: getAuthToken,
});

// Export all API utilities
export {
  defaultClient,
  adminClient,
  ApiError,
  AuthError,
  getConfig,
};

// Export all API services
export { 
  stockApi, 
  authApi, 
  userApi, 
  adminApi, 
  chatApi 
};