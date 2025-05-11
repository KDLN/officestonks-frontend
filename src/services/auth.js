/**
 * Authentication service for the frontend
 * Handles user authentication, token management and auth status
 */

import { fetchWithAuth } from '../utils/http';
import { ENDPOINTS } from '../config/api';

/**
 * Register a new user
 * @param {string} username - Username for new account
 * @param {string} password - Password for new account
 * @returns {Promise<Object>} Registration response with token
 */
export const register = async (username, password) => {
  try {
    const data = await fetchWithAuth(ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store authentication data
    storeAuthData(data);
    return data;
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
    const data = await fetchWithAuth(ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store authentication data
    storeAuthData(data);
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Store authentication data in localStorage
 * @param {Object} data - Auth data from API
 */
const storeAuthData = (data) => {
  // Store token in localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', data.user_id);

  // Store username if available
  if (data.username) {
    localStorage.setItem('username', data.username);
  }

  // Store admin status if available
  if (data.is_admin !== undefined) {
    console.log("Admin status received:", data.is_admin);
    localStorage.setItem('isAdmin', data.is_admin.toString());
  } else {
    console.log("No admin status in response");
  }
};

/**
 * Logout the current user
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('username');
  window.location.href = '/login';
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get authentication token
 * @returns {string|null} Token or null if not authenticated
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get user ID
 * @returns {string|null} User ID or null if not authenticated
 */
export const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Check if user is admin
 * @returns {boolean} True if admin
 */
export const isAdmin = () => {
  const adminStatus = localStorage.getItem('isAdmin');
  console.log("Checking isAdmin from localStorage:", adminStatus);

  // Convert to boolean explicitly
  const result = adminStatus === 'true' || adminStatus === '1';
  console.log("Admin check result:", result);

  return result;
};

/**
 * Set admin status
 * @param {boolean} isAdmin - Admin status to set
 */
export const setAdminStatus = (isAdmin) => {
  localStorage.setItem('isAdmin', isAdmin.toString());
};