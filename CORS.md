# CORS Guide for OfficeSTONKs

This document provides comprehensive information about Cross-Origin Resource Sharing (CORS) configuration, issues, and solutions for the OfficeSTONKs application.

## Table of Contents
1. [Overview](#overview)
2. [Configuration](#configuration)
   - [Backend Configuration](#backend-configuration)
   - [Frontend Configuration](#frontend-configuration)
   - [WebSocket Configuration](#websocket-configuration)
3. [Solutions](#solutions)
   - [Solution 1: Direct Backend Configuration](#solution-1-direct-backend-configuration)
   - [Solution 2: CORS Proxy](#solution-2-cors-proxy)
   - [Solution 3: Custom CORS Proxy](#solution-3-custom-cors-proxy)
   - [Solution 4: Unified Deployment](#solution-4-unified-deployment)
4. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
5. [Local Development](#local-development)
6. [Deployment Configuration](#deployment-configuration)

## Overview

OfficeSTONKs has a frontend deployed on Vercel (`https://officestonks-frontend.vercel.app`) and a backend deployed on Railway (`https://web-copy-production-5b48.up.railway.app`).

CORS is necessary because these are different domains, and browsers block cross-origin requests by default as a security measure.

## Configuration

### Backend Configuration

The backend has been configured to allow requests from our frontend domain:

- The backend CORS allowlist includes: `https://officestonks-frontend.vercel.app`
- CORS settings are managed in `cmd/api/cors.go` on the backend

### Frontend Configuration

All frontend API calls must include the following:

1. **API Base URL** from centralized configuration:
   ```javascript
   import { API_URL } from '../config/api';
   ```

2. **HTTP Utility Functions** for consistent request handling:
   ```javascript
   import { fetchWithAuth } from '../utils/http';
   ```

3. **Credentials Inclusion**: All API calls must handle cookies properly

4. **Authentication**: For authenticated endpoints, include the JWT token in the Authorization header

### WebSocket Configuration

WebSockets use a different protocol (`ws://` or `wss://` instead of `http://` or `https://`):

```javascript
import { WS_URL } from '../config/api';

// Create the WebSocket URL with token for authentication
const wsUrl = `${WS_URL}?token=${token}`;
```

## Solutions

### Solution 1: Direct Backend Configuration

The most direct solution is to properly configure CORS on the backend server:

```go
import "github.com/rs/cors"

c := cors.New(cors.Options{
  AllowedOrigins: []string{"https://officestonks-frontend.vercel.app"},
  AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
  AllowedHeaders: []string{"Content-Type", "Authorization"},
  AllowCredentials: true,
})

handler := c.Handler(r)
```

**Pros:**
- Direct solution that addresses the root cause
- No additional services or proxies needed
- Best performance option

**Cons:**
- Requires backend code changes
- May need coordination with backend team

### Solution 2: CORS Proxy

A CORS proxy can be enabled with an environment variable:

```
REACT_APP_USE_CORS_PROXY=true
```

This solution works by routing API requests through a public CORS proxy service that adds the necessary CORS headers.

**Pros:**
- Quick to implement
- No backend changes needed
- Can be enabled/disabled easily

**Cons:**
- Relies on third-party services
- May have rate limits or reliability issues
- Adds latency to API requests
- Security concerns (requests go through third-party servers)

### Solution 3: Custom CORS Proxy

A simple Node.js proxy server can be deployed separately to handle CORS:

**Pros:**
- Full control over the proxy
- Can be deployed on Vercel or Railway
- More secure than public proxies

**Cons:**
- Requires maintaining another service
- Adds complexity to the architecture
- Still introduces additional latency

### Solution 4: Unified Deployment

Consider deploying both frontend and backend from the same domain to avoid CORS entirely:

**Options:**
1. Serve the frontend from the Go backend (compile and serve as static files)
2. Move both services to the same domain with different paths
3. Use a reverse proxy like Nginx to serve both under the same domain

## Common Issues and Troubleshooting

### CORS Errors in Console
If you see errors like:
```
Access to fetch at 'https://web-copy-production-5b48.up.railway.app/api/auth/login' from origin 'https://officestonks-frontend.vercel.app' has been blocked by CORS policy
```

**Solution**: Check that:
- You're using the centralized HTTP utilities in `utils/http.js`
- You've included the appropriate credentials and headers
- The backend CORS configuration includes your frontend domain
- All API URLs are correctly formed using the centralized configuration

### Authentication Issues
If authorized requests fail:

**Solution**: Ensure:
- The token is properly retrieved from localStorage
- The Authorization header is correctly formatted: `Bearer ${token}`
- The token is also passed as a query parameter for backward compatibility
- Use browser developer tools to verify the token is sent in both the header and URL

### WebSocket CORS Issues
If WebSocket connections fail:

**Solution**: Ensure:
- The WebSocket URL uses the correct protocol (wss:// for secure connections)
- The token is included as a query parameter in the WebSocket URL
- Check if your browser supports WebSocket connections with the current configuration
- Verify the backend WebSocket endpoint is properly configured for CORS
- Look for specific WebSocket errors in the console (error event listeners)

### Debugging CORS with Browser Tools
Use these techniques to diagnose CORS issues:

- Open Chrome DevTools > Network tab and look for failed requests
- Check the request headers to ensure Origin is present
- Examine response headers for Access-Control-Allow-Origin and other CORS headers
- For preflight OPTIONS requests, verify they return 200 OK status
- Look for "blocked by CORS policy" errors in the Console tab

## Local Development

For local development:
- The backend allows requests from `http://localhost:3000`
- Use `npm start` to run the frontend locally
- The frontend proxy is configured in `setupProxy.js` to route API requests

## Deployment Configuration

When deploying to Railway or other platforms, make sure to set these environment variables:

1. `REACT_APP_API_URL` = Your backend API URL (e.g., `https://web-copy-production-5b48.up.railway.app`)
2. `REACT_APP_USE_CORS_PROXY` = Set to `true` if CORS issues persist

This configuration is already set in the provided `.env` file, but you should verify it in your deployment platform's settings.