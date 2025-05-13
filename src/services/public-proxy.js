/**
 * Public proxy service for API requests
 * Uses public CORS proxies to bypass CORS restrictions in production
 */

// Use a free CORS proxy
const PROXY_URL = 'https://corsproxy.io/?';

// Backend URL
const BACKEND_URL = 'https://officestonks-backend-production.up.railway.app';

/**
 * Make a proxied API request through a public CORS proxy
 * @param {string} endpoint - API endpoint to fetch (without /api prefix)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const fetchViaProxy = async (endpoint, options = {}) => {
  // Ensure endpoint starts with /api
  const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api/${endpoint.replace(/^\/+/, '')}`;
  
  // Build the full URL
  const targetUrl = `${BACKEND_URL}${apiEndpoint}`;
  const encodedUrl = encodeURIComponent(targetUrl);
  const proxyUrl = `${PROXY_URL}${encodedUrl}`;
  
  console.log(`Public proxy request to: ${proxyUrl}`);
  
  try {
    // Make the request through the proxy
    const response = await fetch(proxyUrl, {
      ...options,
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Public proxy request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Get news via public CORS proxy
 * @param {number} limit - Maximum number of news items
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - News items
 */
export const getNewsViaProxy = async (limit = 10, offset = 0) => {
  try {
    const endpoint = `/api/news?limit=${limit}&offset=${offset}`;
    const encodedUrl = encodeURIComponent(`${BACKEND_URL}${endpoint}`);
    
    console.log(`Fetching news via public proxy: ${PROXY_URL}${encodedUrl}`);
    
    const response = await fetch(`${PROXY_URL}${encodedUrl}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`News proxy request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('News data via public proxy:', data);
    return data;
  } catch (error) {
    console.error('Error fetching news via public proxy:', error);
    throw error;
  }
};