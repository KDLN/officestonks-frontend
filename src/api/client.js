/**
 * API Client Module
 * Core API client for making HTTP requests
 */

import { ApiError } from './errors';
import { getConfig } from './config';

// Default request headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Core API Client class for handling HTTP requests
 */
class ApiClient {
  /**
   * Create a new API client instance
   * @param {Object} options - Client options
   * @param {string} options.baseUrl - Base API URL
   * @param {Function} options.tokenProvider - Function to get the auth token
   * @param {Object} options.defaultHeaders - Default headers to include
   */
  constructor(options = {}) {
    const config = getConfig();
    this.baseUrl = options.baseUrl || config.API_URL;
    this.tokenProvider = options.tokenProvider || (() => null);
    this.defaultHeaders = { ...DEFAULT_HEADERS, ...options.defaultHeaders };
  }

  /**
   * Create URL for API endpoint
   * @param {string} endpoint - API endpoint path
   * @returns {string} Full URL
   */
  createUrl(endpoint) {
    // Handle absolute URLs
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // Format the endpoint path and join with base URL
    const formattedEndpoint = endpoint.startsWith('/') 
      ? endpoint.substring(1) 
      : endpoint;
      
    return `${this.baseUrl}/${formattedEndpoint}`;
  }

  /**
   * Add authentication to request options
   * @param {Object} options - Request options
   * @returns {Object} Enhanced options with auth
   */
  withAuth(options = {}) {
    const token = this.tokenProvider();
    const headers = { ...this.defaultHeaders, ...options.headers };
    
    // Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return {
      ...options,
      headers,
      credentials: 'include',
      mode: 'cors',
    };
  }

  /**
   * Make API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether request requires authentication
   * @returns {Promise<any>} Response data
   */
  async request(endpoint, options = {}, requiresAuth = true) {
    const url = this.createUrl(endpoint);
    const requestOptions = requiresAuth 
      ? this.withAuth(options) 
      : { ...options, headers: { ...this.defaultHeaders, ...options.headers } };

    try {
      const response = await fetch(url, requestOptions);
      
      // Handle error responses
      if (!response.ok) {
        let errorData;
        
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = {
            error: `HTTP error ${response.status}`,
            message: response.statusText
          };
        }
        
        throw new ApiError(
          errorData.error || errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData
        );
      }
      
      // Handle empty responses
      const text = await response.text();
      if (!text || text.trim() === '') {
        return null;
      }
      
      // Parse JSON response
      try {
        return JSON.parse(text);
      } catch (parseError) {
        throw new ApiError(
          'Invalid JSON response from server',
          response.status,
          { originalText: text }
        );
      }
    } catch (error) {
      // Log the error
      if (process.env.NODE_ENV !== 'production') {
        console.error(`API request failed: ${url}`, error);
      }
      
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
  }
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether request requires authentication
   * @returns {Promise<any>} Response data
   */
  async get(endpoint, options = {}, requiresAuth = true) {
    return this.request(endpoint, { ...options, method: 'GET' }, requiresAuth);
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether request requires authentication
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}, options = {}, requiresAuth = true) {
    return this.request(
      endpoint, 
      { 
        ...options, 
        method: 'POST',
        body: JSON.stringify(data)
      }, 
      requiresAuth
    );
  }
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether request requires authentication
   * @returns {Promise<any>} Response data
   */
  async put(endpoint, data = {}, options = {}, requiresAuth = true) {
    return this.request(
      endpoint, 
      { 
        ...options, 
        method: 'PUT',
        body: JSON.stringify(data)
      }, 
      requiresAuth
    );
  }
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @param {boolean} requiresAuth - Whether request requires authentication
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint, options = {}, requiresAuth = true) {
    return this.request(endpoint, { ...options, method: 'DELETE' }, requiresAuth);
  }
}

export default ApiClient;