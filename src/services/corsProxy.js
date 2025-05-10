// CORS Proxy Service
// This file provides a way to route API requests through a CORS proxy

// Public CORS proxies - use only for development/testing!
const PUBLIC_PROXIES = [
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url='
];

// Choose a proxy to use - default to the first one
const PROXY_INDEX = 0;
const PROXY_URL = PUBLIC_PROXIES[PROXY_INDEX];

// Original API URL
const ORIGINAL_API_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';

// Function to create a proxied URL
export const createProxiedUrl = (endpoint) => {
  // Remove /api prefix if it exists in the endpoint
  const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
  
  // Create the target URL
  const targetUrl = `${ORIGINAL_API_URL}/api/${cleanEndpoint}`;
  
  // Return the proxied URL
  return `${PROXY_URL}${encodeURIComponent(targetUrl)}`;
};

// Function to help migrate existing code to use the proxy
export const getProxyConfig = (enabled = true) => {
  // If proxy is not enabled, just return the original API URL functions
  if (!enabled) {
    return {
      createUrl: (endpoint) => `${ORIGINAL_API_URL}/api/${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`,
      proxyEnabled: false
    };
  }

  return {
    createUrl: createProxiedUrl,
    proxyEnabled: true
  };
};

// Export constants
export const API_URL = ORIGINAL_API_URL;
export const PROXY_ENABLED = process.env.REACT_APP_USE_CORS_PROXY === 'true';

console.log(`CORS Proxy service initialized with: ${PROXY_ENABLED ? PROXY_URL : 'No proxy (disabled)'}`);