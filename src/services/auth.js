// Authentication service for the frontend
import { getProxyConfig, PROXY_ENABLED, createDirectUrl } from './corsProxy';

// Get API URL helpers
const { createUrl } = getProxyConfig();

// Original API URL (for reference only)
const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';
const API_URL = `${BASE_URL}/api`;
console.log("Using API URL:", PROXY_ENABLED ? "CORS Proxy -> " + API_URL : API_URL);

// Register a new user
export const register = async (username, password) => {
  try {
    // Create URL with proxy if enabled
    const endpoint = 'auth/register';
    const apiUrl = PROXY_ENABLED ? createUrl(endpoint) : `${API_URL}/${endpoint}`;

    // Prepare request config with auth
    const { url, options } = addAuthToRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("Making registration request to:", url);

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await response.json();

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

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Login an existing user
export const login = async (username, password) => {
  try {
    // Create URL with proxy if enabled
    const endpoint = 'auth/login';
    const apiUrl = PROXY_ENABLED ? createUrl(endpoint) : `${API_URL}/${endpoint}`;

    // Prepare request config with auth
    const { url, options } = addAuthToRequest(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    console.log("Making login request to:", url);

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();

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

    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('username');
  window.location.href = '/login';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Get authentication token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Add auth token to API request
export const addAuthToRequest = (url, options = {}) => {
  const token = getToken();
  const config = getProxyConfig();

  // Ensure headers object exists
  if (!options.headers) {
    options.headers = {};
  }

  // Add token to Authorization header if available and enabled
  if (token && config.addAuthToHeader) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Set credentials mode based on config
  if (config.useCredentials) {
    options.credentials = 'include';
  } else {
    options.credentials = 'omit';  // Don't send cookies
  }

  // If there's a token and it's not in the url, add it as a query parameter as well
  // This is for backward compatibility and extra security
  if (token && config.addAuthToUrl && !url.includes('token=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}token=${token}`;
  }

  return { url, options };
};

// Get user ID
export const getUserId = () => {
  return localStorage.getItem('userId');
};

// Check if user is admin
export const isAdmin = () => {
  const adminStatus = localStorage.getItem('isAdmin');
  console.log("Checking isAdmin from localStorage:", adminStatus);

  // Convert to boolean explicitly
  const result = adminStatus === 'true' || adminStatus === '1';
  console.log("Admin check result:", result);

  return result;
};

// Set admin status
export const setAdminStatus = (isAdmin) => {
  localStorage.setItem('isAdmin', isAdmin.toString());
};