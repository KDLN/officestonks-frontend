/**
 * Authentication API Service
 * Handles authentication-related API requests
 */

import { defaultClient } from '../index';
import { getConfig } from '../config';

const ENDPOINTS = getConfig().ENDPOINTS.AUTH;

/**
 * Register a new user
 * @param {string} username - Username for new account
 * @param {string} password - Password for new account
 * @returns {Promise<Object>} Registration response with token
 */
export const register = async (username, password) => {
  try {
    return await defaultClient.post(
      ENDPOINTS.REGISTER, 
      { username, password },
      {},
      false // No authentication needed for register
    );
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Login an existing user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response with token
 */
export const login = async (username, password) => {
  try {
    return await defaultClient.post(
      ENDPOINTS.LOGIN, 
      { username, password },
      {},
      false // No authentication needed for login
    );
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Check admin status against the API
 * @returns {Promise<boolean>} Whether user is admin
 */
export const checkAdminStatus = async () => {
  try {
    const response = await defaultClient.get(
      getConfig().ENDPOINTS.ADMIN.STATUS,
      {},
      true
    );
    
    return response && response.isAdmin === true;
  } catch (error) {
    console.error("Admin status check error:", error);
    return false;
  }
};