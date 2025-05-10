# Deploying the Frontend to Railway

This guide explains how to deploy the OfficeStonks frontend to Railway.

## Important Note About Railway Limitations

Railway currently doesn't offer path-based routing between services on the same hostname. This means you cannot route `/api/*` to one service and other paths to another service directly in Railway.

## Deployment Options

### Option 1: Deploy with CORS Proxy (Simplest Approach)

1. Go to your Railway dashboard
2. Create a new service for the frontend (separate from backend)
3. Configure environment variables:
   ```
   REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app
   REACT_APP_USE_CORS_PROXY=true
   ```
4. Deploy the service

This approach uses our integrated CORS proxy to bypass CORS restrictions.

### Option 2: Deploy a Reverse Proxy Service (Most Robust)

We've created a separate reverse proxy service that can route requests appropriately:

1. Deploy the backend service
2. Deploy the frontend service
3. Deploy the reverse proxy service with environment variables:
   ```
   BACKEND_URL=https://your-backend-service.up.railway.app
   FRONTEND_URL=https://your-frontend-service.up.railway.app
   ```
4. Use the reverse proxy service's URL as the main application URL

The reverse proxy will route `/api/*` requests to the backend and all other requests to the frontend.

### Option 3: Enhance Backend to Serve Frontend (Unified Approach)

Modify the backend to also serve the frontend static files:

1. Build the frontend: `npm run build`
2. Copy the build files to the backend's static directory
3. Update the backend's router to serve frontend files for non-API routes
4. Deploy only the backend service

## Deployment Steps for Option 1 (CORS Proxy)

1. Go to your Railway dashboard
2. Create a new service from your frontend GitHub repo
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app
   REACT_APP_USE_CORS_PROXY=true
   ```
4. Deploy the service

## Recommended Approach

For now, we recommend Option 1 (CORS Proxy) as it's the simplest solution that works immediately. If you want a more robust long-term solution, consider Option 2 (Reverse Proxy) or Option 3 (Unified Backend).

## Troubleshooting

If you experience deployment issues:

1. **Build Failures**: Check the build logs for errors
2. **Serving Issues**: Verify that `serve` is properly handling routes
3. **Environment Variables**: Ensure variables are correctly set and available at build time
4. **CORS Issues**: If CORS issues persist with the proxy, try the reverse proxy solution