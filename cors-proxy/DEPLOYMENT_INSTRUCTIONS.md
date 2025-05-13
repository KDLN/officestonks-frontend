# CORS Proxy Deployment Instructions

This document provides instructions for resolving CORS issues with admin endpoints by deploying the updated CORS proxy to Railway.

## Background

The admin functions (stock price reset and chat clearing) were not working in production due to CORS errors. The root cause was using wildcard origins (`*`) with credentials mode, which is not allowed by browsers.

## Solution

We've updated the CORS proxy to:
1. Use specific origins instead of wildcards when credentials are involved
2. Add proper CORS headers for preflight requests
3. Ensure consistent handling of OPTIONS requests

To fix the issue, we need to deploy the updated CORS proxy separately since the frontend is built as a static bundle during Docker build.

## Deployment Steps

### 1. Deploy the CORS Proxy to Railway

1. Navigate to the cors-proxy directory:
   ```bash
   cd /path/to/officestonks-frontend/cors-proxy
   ```

2. Run the deployment script:
   ```bash
   ./deploy-to-railway.sh
   ```

   This will:
   - Create a railway.json configuration (if it doesn't exist)
   - Set the required environment variables (BACKEND_URL and NODE_ENV)
   - Deploy the service to Railway

3. Once deployment is complete, note the URL (should be https://officestonks-cors-proxy.up.railway.app)

### 2. Verify Environment Variables

Make sure the frontend is configured to use the CORS proxy by checking:

1. Railway environment variables (via the Railway dashboard):
   - REACT_APP_API_URL=https://officestonks-cors-proxy.up.railway.app
   - REACT_APP_USE_CORS_PROXY=true

2. Dockerfile configuration (for future builds):
   ```dockerfile
   ENV REACT_APP_API_URL=https://officestonks-cors-proxy.up.railway.app
   ENV REACT_APP_USE_CORS_PROXY=true
   ```

### 3. Testing

To verify that the CORS proxy is working correctly:

1. Visit the frontend application (https://officestonks-frontend-production.up.railway.app)
2. Log in with admin credentials
3. Test the admin functions:
   - Reset stock prices
   - Clear chat history
4. Check browser console for any CORS errors
5. Verify the CORS proxy health endpoint is responding:
   ```
   curl https://officestonks-cors-proxy.up.railway.app/health
   ```

### 4. Troubleshooting

If issues persist:

1. Check the CORS proxy logs in the Railway dashboard
2. Verify that the admin service is using the correct credentials mode:
   ```javascript
   // in src/services/admin.js
   credentials: window.location.origin === ADMIN_API_URL ? 'same-origin' : 'omit'
   ```
3. Ensure the frontend is correctly pointing to the CORS proxy
4. Test direct API access (bypassing the frontend) to isolate if it's a CORS or API issue

## References

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express CORS middleware](https://github.com/expressjs/cors)
- [Railway Deployment Docs](https://docs.railway.app/deploy/nodejs)