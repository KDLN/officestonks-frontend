// Authentication service for the frontend
import { getProxyConfig, PROXY_ENABLED } from './corsProxy';

// Get API URL helpers
const { createUrl } = getProxyConfig(PROXY_ENABLED);

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

  // Ensure headers object exists
  if (!options.headers) {
    options.headers = {};
  }

  // Add token to Authorization header if available
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  // Always include credentials
  options.credentials = 'include';

  // If there's a token and it's not in the url, add it as a query parameter as well
  // This is for backward compatibility and extra security
  if (token && !url.includes('token=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}token=${token}`;
  }

  return { url, options };
};

// Get user ID
export const getUserId = () => {
  return localStorage.getItem('userId');
};