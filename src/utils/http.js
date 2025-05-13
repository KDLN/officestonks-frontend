/**
 * HTTP utilities for API communication
 * Provides consistent fetch wrappers with error handling and authentication
 */

import { getToken } from '../services/auth';
import { API_URL, DEFAULT_HEADERS, CORS_PROXY_URL } from '../config/api';

/**
 * Standard API error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Adds authentication to a request
 * @param {Object} options - Request options
 * @returns {Object} Enhanced options with auth headers/credentials
 */
export const addAuthToOptions = (options = {}) => {
  const token = getToken();
  
  // Create a new options object
  const enhancedOptions = {
    ...options,
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers
    }
  };
  
  // Add auth header if token exists
  if (token) {
    enhancedOptions.headers.Authorization = `Bearer ${token}`;
    console.log('Adding Authorization header with token:', token.substring(0, 10) + '...');
  } else {
    console.log('No token available for Authorization header');
  }
  
  return enhancedOptions;
};

/**
 * Fetches data from an API endpoint with authentication
 * @param {string} endpoint - API endpoint to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const fetchWithAuth = async (endpoint, options = {}) => {
  // Ensure endpoint is properly formatted - IMPORTANT: avoid path duplication
  // Log all parameters for debugging
  console.log('fetchWithAuth request:', { endpoint, API_URL });
  
  // Format URL correctly
  let url;
  if (endpoint.startsWith('http')) {
    url = endpoint; // Use full URL directly
  } else {
    // Remove leading slashes to avoid path duplication
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    url = `${API_URL}/${cleanEndpoint}`;
  }
  
  console.log('Constructed URL:', url);

  // Add authentication to options
  const enhancedOptions = addAuthToOptions(options);

  // Ensure CORS mode is set
  enhancedOptions.mode = 'cors';

  try {
    const response = await fetch(url, enhancedOptions);

    // Handle non-OK responses
    if (!response.ok) {
      let errorData;

      try {
        // Try to parse error JSON
        errorData = await response.json();
      } catch (parseError) {
        // If parsing fails, create a basic error object
        errorData = {
          error: `HTTP error ${response.status}`,
          message: response.statusText
        };
      }

      // Throw ApiError with consistent structure
      throw new ApiError(
        errorData.error || errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Parse JSON response
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new ApiError('Invalid JSON response from server', 200, { originalText: text });
    }
  } catch (error) {
    // Log the error
    console.error(`API request failed: ${url}`, error);

    // Rethrow ApiError as is, or wrap other errors
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(
        error.message || 'Network request failed',
        0,
        { originalError: error.toString() }
      );
    }
  }
};

/**
 * Fetches data with direct backend connection using CORS
 * @param {string} endpoint - API endpoint to fetch
 * @param {Object} options - Fetch options
 * @param {Object} mockData - Fallback mock data to return if request fails
 * @returns {Promise} Result of the fetch or mock data
 */
export const fetchWithFallback = async (endpoint, options = {}, mockData = null) => {
  // Ensure endpoint is properly formatted for direct backend URL
  const isFullUrl = endpoint.startsWith('http');

  // Connect directly to backend API
  const url = isFullUrl
    ? endpoint
    : `${API_URL}/${endpoint.replace(/^\/+/, '')}`;

  // Get authentication token
  const token = getToken();

  try {
    // Set up proper CORS request
    const corsOptions = {
      ...options,
      mode: 'cors',
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers
      }
    };

    // Add token to Authorization header if available
    if (token && !corsOptions.headers.Authorization) {
      corsOptions.headers.Authorization = `Bearer ${token}`;
      console.log('Adding Authorization header to CORS request');
    }

    const response = await fetch(url, corsOptions);

    // Handle non-OK responses
    if (!response.ok) {
      let errorData;

      try {
        // Try to parse error JSON
        errorData = await response.json();
      } catch (parseError) {
        // If parsing fails, create a basic error object
        errorData = {
          error: `HTTP error ${response.status}`,
          message: response.statusText
        };
      }

      // Throw ApiError with consistent structure
      throw new ApiError(
        errorData.error || errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Parse JSON response
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new ApiError('Invalid JSON response from server', 200, { originalText: text });
    }
  } catch (error) {
    console.error('API request failed:', error);

    // Log CORS-specific errors
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.error('CORS error detected. Verify that the backend has proper CORS headers configured.');
      console.error('Current request details:', {
        endpoint,
        method: options.method || 'GET',
        url: url,
        origin: window.location.origin
      });
    }

    // Return mock data as fallback
    return mockData || {
      success: false,
      message: 'Operation failed - using mock data',
      mockData: true,
      error: error.message
    };
  }
};