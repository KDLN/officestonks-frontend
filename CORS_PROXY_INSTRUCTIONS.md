# CORS Proxy for OfficeSTONKs

This document explains how to set up and use the CORS proxy for OfficeSTONKs.

## What is the CORS Proxy?

The CORS proxy is a small Node.js server that sits between the frontend and backend APIs. It solves Cross-Origin Resource Sharing (CORS) issues by:

1. Forwarding requests from the frontend to the backend
2. Adding the proper CORS headers to responses
3. Handling WebSocket connections which are particularly prone to CORS issues

## Deploying the CORS Proxy

### Option 1: Deploy to Railway

1. Create a new project in Railway from the `cors-proxy` directory
2. Set the environment variable `BACKEND_URL` to your actual backend URL:
   ```
   BACKEND_URL=https://web-production-1e26.up.railway.app
   ```
3. Deploy the service
4. Get the Railway URL for your deployed proxy (e.g., `https://officestonks-cors-proxy.up.railway.app`)

### Option 2: Run Locally for Development

1. Navigate to the `cors-proxy` directory
2. Install dependencies:
   ```
   npm install
   ```
3. Set the environment variable and run:
   ```
   BACKEND_URL=https://web-production-1e26.up.railway.app npm start
   ```
4. The proxy will be available at `http://localhost:3000`

## Frontend Configuration

### Update API URL

The only change needed in the frontend is to update the API URL to use the proxy:

1. In `/frontend/src/services/websocket.js`, change:
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'https://web-production-1e26.up.railway.app';
   ```
   to
   ```javascript
   const apiUrl = process.env.REACT_APP_API_URL || 'https://officestonks-cors-proxy.up.railway.app';
   ```

2. Alternatively, set the environment variable `REACT_APP_API_URL` to your proxy URL:
   ```
   REACT_APP_API_URL=https://officestonks-cors-proxy.up.railway.app
   ```

### No Other Changes Needed

The CORS proxy is designed to be a drop-in replacement. It will:

- Forward all `/api/*` requests to the backend's `/api/*` endpoints
- Forward all WebSocket connections to the backend's `/ws` endpoint
- Add the necessary CORS headers to allow cross-origin requests

## How It Works

1. **API Requests**: The proxy forwards `/api/*` requests to the backend, adding CORS headers to responses
2. **WebSocket Connections**: The proxy forwards WebSocket connections to the backend's `/ws` endpoint
3. **Health Checks**: The proxy provides a `/health` endpoint for checking connectivity

## Troubleshooting

If you encounter issues:

1. **Check the Proxy Logs**: The proxy logs all requests and responses, making it easy to identify issues
2. **Verify Environment Variables**: Make sure `BACKEND_URL` is set correctly in the proxy deployment
3. **Check Health Endpoints**: Use the `/health` endpoint to verify the proxy is running correctly
4. **WebSocket Connection**: Check browser console for WebSocket connection errors
5. **CORS Headers**: Verify that CORS headers are being correctly added to responses

## Security Considerations

The CORS proxy is configured to accept requests from any origin (`*`). In a production environment, you may want to restrict this to specific origins:

```javascript
app.use(cors({
  origin: ['https://officestonks-frontend.vercel.app', 'http://localhost:3000'],
  // other options...
}));
```