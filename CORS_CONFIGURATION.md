# CORS Configuration Guide for Office Stonks

This document explains how Cross-Origin Resource Sharing (CORS) is configured between our frontend and backend services.

## Overview

Our application has a frontend deployed on Vercel (`https://officestonks-frontend.vercel.app`) and a backend deployed on Railway (`https://web-copy-production-5b48.up.railway.app`).

CORS is necessary because these are different domains, and browsers block cross-origin requests by default as a security measure.

## Backend Configuration

The backend has been configured to allow requests from our frontend domain:

- The backend CORS allowlist includes: `https://officestonks-frontend.vercel.app`
- CORS settings are managed in `cmd/api/cors.go` on the backend

## Frontend Requirements

All frontend API calls must include the following:

1. **API Base URL**: 
   ```javascript
   const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';
   const API_URL = `${BASE_URL}/api`;
   ```

2. **Credentials Inclusion**: ALL API calls must include `credentials: 'include'` to handle cookies properly:
   ```javascript
   fetch(`${API_URL}/endpoint`, {
     // other options...
     credentials: 'include',
   });
   ```

3. **Authentication**: For authenticated endpoints, include the JWT token in the Authorization header:
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`,
   }
   ```

## WebSocket Configuration

WebSockets use a different protocol (`ws://` or `wss://` instead of `http://` or `https://`):

```javascript
// Convert http/https to ws/wss
const wsBase = apiUrl.replace(/^http/, 'ws');
const wsUrl = `${wsBase}/ws?token=${token}`;
```

## Common Issues and Solutions

1. **CORS Errors in Console**: If you see errors like:
   ```
   Access to fetch at 'https://web-copy-production-5b48.up.railway.app/api/auth/login' from origin 'https://officestonks-frontend.vercel.app' has been blocked by CORS policy
   ```

   **Solution**: Check that:
   - You've included `credentials: 'include'` in all fetch requests
   - You're using the `addAuthToRequest` helper function from `auth.js` for all API calls
   - The backend CORS configuration includes your frontend domain
   - All API URLs are correctly formed (using the BASE_URL and API_URL constants)

2. **Authentication Issues**: If authorized requests fail:

   **Solution**: Ensure:
   - The token is properly retrieved from localStorage
   - The Authorization header is correctly formatted: `Bearer ${token}`
   - The token is also passed as a query parameter for backward compatibility
   - Use browser developer tools to verify the token is sent in both the header and URL

3. **WebSocket CORS Issues**: If WebSocket connections fail:

   **Solution**: Ensure:
   - The WebSocket URL uses the correct protocol (wss:// for secure connections)
   - The token is included as a query parameter in the WebSocket URL
   - Check if your browser supports WebSocket connections with the current configuration
   - Verify the backend WebSocket endpoint is properly configured for CORS
   - Look for specific WebSocket errors in the console (error event listeners)

4. **Debugging CORS with Browser Tools**: Use these techniques to diagnose CORS issues:

   - Open Chrome DevTools > Network tab and look for failed requests
   - Check the request headers to ensure Origin is present
   - Examine response headers for Access-Control-Allow-Origin and other CORS headers
   - For preflight OPTIONS requests, verify they return 200 OK status
   - Look for "blocked by CORS policy" errors in the Console tab

5. **Backend CORS Configuration Check**: Verify the backend is configured correctly:

   - Ensure the backend allows your frontend domain with:
     ```go
     w.Header().Set("Access-Control-Allow-Origin", "https://officestonks-frontend.vercel.app")
     ```
   - Credentials support must be enabled:
     ```go
     w.Header().Set("Access-Control-Allow-Credentials", "true")
     ```
   - Required headers must be permitted:
     ```go
     w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
     ```
   - OPTIONS preflight requests should be handled properly

6. **Adding New Deployment Domains**:

   If you deploy the frontend to a new domain, you must:
   - Ask the backend team to add the new domain to the CORS allowlist in `cmd/api/cors.go`
   - Or update the backend to accept the Origin header dynamically (current configuration)

## Local Development

For local development:
- The backend allows requests from `http://localhost:3000`
- Use `npm start` to run the frontend locally

## API Structure

The backend API follows this general structure:
- Base URL: `https://web-copy-production-5b48.up.railway.app`
- API Prefix: `/api`
- Endpoints: `/api/auth/login`, `/api/stocks`, etc.

## Environment Configuration

The API URL is configured via environment variables:
```
REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app
```

This value is in the `.env` file and should be updated if the backend URL changes.

## CORS Troubleshooting Flowchart

If you're experiencing CORS issues, follow this troubleshooting flowchart:

1. **Check Console for Errors**
   - Look for "blocked by CORS policy" errors
   - Note the specific endpoint causing issues
   - Check if it's a preflight (OPTIONS) request failure

2. **Verify Frontend Request Configuration**
   - ✅ Using `addAuthToRequest` helper function?
   - ✅ Setting `credentials: 'include'`?
   - ✅ Using correct API URL?
   - ✅ Proper Authorization header?

3. **Check Backend CORS Configuration**
   - ✅ Frontend domain in allowed origins?
   - ✅ `Access-Control-Allow-Credentials: true` set?
   - ✅ Correct headers allowed?
   - ✅ Handling OPTIONS requests properly?

4. **Test with Browser Developer Tools**
   - Make a test request in the Console
   - Examine Network tab for request/response headers
   - Verify Origin header is sent
   - Check that CORS headers are in the response

5. **WebSocket-Specific Issues**
   - ✅ Using wss:// protocol for secure connections?
   - ✅ Token included in WebSocket URL?
   - ✅ WebSocket endpoint configured for CORS?
   - ✅ Backend handling WebSocket upgrade requests?

6. **Common Fixes**
   - Update the `addAuthToRequest` usage across all services
   - Ensure backend CORS middleware has the latest configuration
   - Check for typos in URLs or domain names
   - Verify that tokens are valid and not expired

7. **Last Resort**
   - Try a temporary CORS proxy for testing
   - Use browser extensions like "CORS Unblock" for local development ONLY
   - Check backend logs for any errors during preflight requests