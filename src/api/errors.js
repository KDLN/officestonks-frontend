/**
 * API Errors Module
 * Custom error classes for API operations
 */

/**
 * API Error class for standardized error handling
 */
export class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} data - Additional error data
   */
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    
    // For better stack traces in modern JS environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  /**
   * Check if error is authorization-related
   * @returns {boolean} True if authorization error
   */
  isAuthError() {
    return this.status === 401 || this.status === 403;
  }
  
  /**
   * Check if error is server-related
   * @returns {boolean} True if server error
   */
  isServerError() {
    return this.status >= 500;
  }
  
  /**
   * Check if error is client-related
   * @returns {boolean} True if client error
   */
  isClientError() {
    return this.status >= 400 && this.status < 500;
  }
  
  /**
   * Check if error is network-related
   * @returns {boolean} True if network error
   */
  isNetworkError() {
    return this.status === 0;
  }
  
  /**
   * Get user-friendly error message
   * @returns {string} User-friendly error message
   */
  getUserMessage() {
    if (this.isAuthError()) {
      return 'Authentication error. Please log in again.';
    }
    
    if (this.isServerError()) {
      return 'Server error. Please try again later.';
    }
    
    if (this.isNetworkError()) {
      return 'Network error. Please check your connection.';
    }
    
    return this.message || 'An unexpected error occurred.';
  }
}

/**
 * Authorization Error class for auth-specific errors
 */
export class AuthError extends ApiError {
  /**
   * Create a new authorization error
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {Object} data - Additional error data
   */
  constructor(message = 'Authentication failed', status = 401, data = null) {
    super(message, status, data);
    this.name = 'AuthError';
  }
}