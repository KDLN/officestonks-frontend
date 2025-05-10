// Authentication service for the frontend

// API URL
// Make sure to include the correct API path
const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';
const API_URL = `${BASE_URL}/api`;
console.log("Using API URL:", API_URL);

// Register a new user
export const register = async (username, password) => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

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
    throw error;
  }
};

// Login an existing user
export const login = async (username, password) => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

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