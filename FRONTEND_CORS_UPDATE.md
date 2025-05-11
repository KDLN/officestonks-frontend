# Frontend CORS Update Instructions

This document provides detailed instructions for resolving the CORS issues in the OfficeSTONKs frontend application. These instructions address the specific problems identified in the current implementation.

## Current Issue

The frontend application has both `BACKEND_URL` and `CORS_PROXY_URL` defined in the configuration, but it's not properly using the proxy URL for its connections:

```javascript
// In src/config/api.js
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://web-production-1e26.up.railway.app';
export const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://officestonks-cors-proxy.up.railway.app';
```

This causes:
1. All API requests going directly to the backend URL instead of through the CORS proxy
2. WebSocket connections failing due to CORS restrictions
3. 401 Unauthorized errors due to cookies not being properly handled

## Solution: Update API Configuration

### Step 1: Update `src/config/api.js`

Replace the current configuration with the version below that consistently uses the CORS proxy:

```javascript
/**
 * Centralized API configuration for the application
 * This file provides consistent API URLs and settings across the application
 */

// Detect if we're running in localhost
export const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Use the CORS proxy URL as the main backend URL for all API requests
export const BACKEND_URL = process.env.REACT_APP_API_URL || 'https://officestonks-cors-proxy.up.railway.app';

// API route base - this will prefix all API endpoints
export const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;

// Keep the original backend URL for documentation purposes
export const ORIGINAL_BACKEND_URL = 'https://web-production-1e26.up.railway.app';

// WebSocket URL (converts HTTP to WS protocol)
export const WS_URL = API_URL.replace(/^http/, 'ws').replace('/api', '/ws');

// Log configuration
console.log('API Config:', {
  isLocalhost,
  BACKEND_URL,
  API_URL,
  WS_URL
});

// Default request configuration for fetch
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// API endpoints remain the same - the proxy will route these correctly
export const ENDPOINTS = {
  // Auth endpoints
  LOGIN: 'auth/login',
  REGISTER: 'auth/register',
  
  // User endpoints
  USER_PROFILE: 'users/me',
  LEADERBOARD: 'users/leaderboard',
  
  // Stock endpoints
  STOCKS: 'stocks',
  STOCK_DETAIL: (id) => `stocks/${id}`,
  PORTFOLIO: 'portfolio',
  TRADING: 'trading',
  TRANSACTIONS: 'transactions',
  
  // Admin endpoints
  ADMIN_STATUS: 'admin/status',
  ADMIN_USERS: 'admin/users',
  ADMIN_USER: (id) => `admin/users/${id}`,
  ADMIN_STOCKS_RESET: 'admin/stocks/reset',
  ADMIN_CHAT_CLEAR: 'admin/chat/clear',
  
  // Chat endpoints
  CHAT_MESSAGES: 'chat/messages',
  CHAT_SEND: 'chat/send',
  
  // Health check endpoints
  API_HEALTH: 'health',
  WS_HEALTH: 'ws/health'
};
```

### Step 2: Update WebSocket Implementation

Ensure the WebSocket service uses the correct URL from the config. Update `src/services/websocket.js` to use our centralized configuration:

```javascript
// Near the top of the file, replace any direct URL references with:
import { getToken } from './auth';
import { WS_URL } from '../config/api';

// Then in the initWebSocket function, use WS_URL directly:
const wsUrl = `${WS_URL}?token=${token}`;
console.log('Connecting to WebSocket:', wsUrl);
socket = new WebSocket(wsUrl);
```

### Step 3: Update Fetch Options in HTTP Utility

In `src/utils/http.js`, ensure all fetch requests include credentials:

```javascript
// Add credentials to the enhancedOptions in addAuthToOptions
export const addAuthToOptions = (options = {}) => {
  const token = getToken();
  
  // Create a new options object
  const enhancedOptions = {
    ...options,
    credentials: 'include', // Add this line to include credentials in all requests
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
```

## Testing the Changes

After making these updates:

1. **Check the console logs** after the app loads - verify the API Config shows the correct CORS proxy URL
2. **Inspect network requests** in developer tools - all API requests should now go to the CORS proxy URL
3. **Verify WebSocket connection** - check that WebSocket connects to the wss:// version of the CORS proxy
4. **Test API functionality** - ensure login, stock data, and other features work without CORS errors

## Common Issues

If you still encounter issues after making these changes:

1. **Environment Variables**: Make sure no environment variables are overriding the URLs
   ```
   # Check that these don't point to the wrong URL
   REACT_APP_API_URL
   REACT_APP_CORS_PROXY_URL
   ```

2. **Caching**: Clear browser cache and hard reload (Ctrl+Shift+R) to ensure changes take effect

3. **CORS Proxy Status**: Verify the CORS proxy is running and available at the specified URL
   ```
   # Test the health endpoint
   curl https://officestonks-cors-proxy.up.railway.app/health
   ```

4. **Browser Console**: Check for any remaining CORS errors in the console. They should show exactly which requests are failing

## Proxy Server Information

The CORS proxy is deployed at:
- URL: `https://officestonks-cors-proxy.up.railway.app`
- Source: `/cors-proxy` directory in this repository
- Environment Variables: `BACKEND_URL=https://web-production-1e26.up.railway.app`

If you need to modify the proxy server, see the instructions in `/cors-proxy/README.md`.

## Additional Information

If needed, we can also implement a more robust HTTP utility that includes automatic retry with different connection methods, similar to what was done for the database connection.