// CORS Service for API Communication
// This file helps the frontend communicate with the backend API

// Original API URL
const ORIGINAL_API_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';

// Direct API connection (standard approach)
// This approach makes direct requests to the API
export const createDirectUrl = (endpoint) => {
  // Remove /api prefix if it exists in the endpoint
  const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
  
  // Create the target URL
  return `${ORIGINAL_API_URL}/api/${cleanEndpoint}`;
};

// Configuration function that returns the appropriate settings for API calls
export const getProxyConfig = (enabled = true) => {
  // Just use direct connection - no proxy needed
  return {
    createUrl: createDirectUrl,
    useCredentials: true,   // Include credentials in the request
    addAuthToHeader: true,  // Add Authorization header
    addAuthToUrl: true      // Add token to URL as fallback
  };
};

// Export constants
export const API_URL = ORIGINAL_API_URL;
export const PROXY_ENABLED = false;  // Disable any proxy attempts

console.log(`API Service initialized with direct connection to: ${ORIGINAL_API_URL}`);