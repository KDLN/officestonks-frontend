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
  // Ensure endpoint is properly formatted
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_URL}/${endpoint.replace(/^\/+/, '')}`;

  // Add authentication to options
  const enhancedOptions = addAuthToOptions(options);

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
 * Fetches data with a fallback to no-cors mode if CORS fails
 * @param {string} endpoint - API endpoint to fetch
 * @param {Object} options - Fetch options
 * @param {Object} mockData - Fallback mock data to return if request fails
 * @returns {Promise} Result of the fetch or mock data
 */
export const fetchWithFallback = async (endpoint, options = {}, mockData = null) => {
  // Ensure endpoint is properly formatted for the CORS proxy
  const isFullUrl = endpoint.startsWith('http');

  // For direct API endpoints, add them to the CORS proxy URL
  const url = isFullUrl
    ? endpoint
    : `${CORS_PROXY_URL}/${endpoint.replace(/^\/+/, '')}`;

  // Add token as query parameter for CORS proxy
  const token = getToken();
  const urlWithToken = token && !url.includes('token=')
    ? `${url}${url.includes('?') ? '&' : '?'}token=${token}`
    : url;

  try {
    // First try with regular CORS mode
    const corsOptions = {
      ...options,
      mode: 'cors',
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers
      }
    };

    const response = await fetch(urlWithToken, corsOptions);

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
  } catch (corsError) {
    console.log(`CORS request failed, trying no-cors mode:`, corsError);

    try {
      // Try with no-cors mode as fallback
      const noCorsOptions = {
        ...options,
        mode: 'no-cors',
        headers: {
          ...DEFAULT_HEADERS,
          ...options.headers
        }
      };

      await fetch(urlWithToken, noCorsOptions);
      console.log('Request sent with no-cors mode (response data unavailable)');

      // Return mock data for no-cors mode since we can't read the response
      return mockData || {
        success: true,
        message: 'Operation may have succeeded',
        mockData: true
      };
    } catch (error) {
      console.error('Both CORS and no-cors requests failed:', error);

      // Throw ApiError with consistent structure
      throw new ApiError(
        'Failed to communicate with server',
        0,
        { corsError: corsError.toString(), fallbackError: error.toString() }
      );
    }
  }
};