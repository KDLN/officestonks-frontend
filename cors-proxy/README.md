# CORS Proxy Server

This directory contains the CORS proxy server for the OfficeSTONKs application. This proxy server handles CORS issues and WebSocket connections between the frontend and backend.

## How It Works

The proxy server:

1. Routes all API requests from `/api/*` to the backend's corresponding endpoints
2. Routes WebSocket connections from `/ws` to the backend's WebSocket endpoint
3. Adds proper CORS headers to all responses
4. Includes detailed logging for troubleshooting

## Deployment Instructions

### Deploying to Railway

1. Create a new project in Railway from the contents of this directory
2. Set the required environment variables:
   ```
   BACKEND_URL=https://web-production-1e26.up.railway.app
   PORT=3000 (optional, Railway sets this automatically)
   ```
3. Deploy the service
4. Get the deployment URL from Railway (e.g., `https://officestonks-cors-proxy.up.railway.app`)

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run with environment variables:
   ```bash
   BACKEND_URL=https://web-production-1e26.up.railway.app npm start
   ```

3. For development with auto-reload:
   ```bash
   BACKEND_URL=https://web-production-1e26.up.railway.app npm run dev
   ```

## Monitoring and Logs

The proxy server includes detailed logging that can help diagnose issues:

- All requests are logged with their method, URL, and origin
- WebSocket connection attempts are logged
- Errors include detailed diagnostic information

You can view these logs in the Railway dashboard.

## Technical Details

### Libraries Used

- `express`: Web server framework
- `cors`: CORS handling middleware
- `http-proxy-middleware`: Proxying requests to the backend

### Endpoints

- `/health`: Health check endpoint that returns status information
- `/api/*`: Proxies all API requests to the corresponding backend endpoint
- `/ws`: Proxies WebSocket connections to the backend's WebSocket endpoint

### CORS Configuration

The default configuration allows requests from any origin (`*`). You can restrict this to specific origins by modifying the CORS configuration in `proxy-server.js`:

```javascript
app.use(cors({
  origin: ['https://officestonks-frontend.vercel.app', 'http://localhost:3000'],
  // other options...
}));
```

## Customizing the Proxy

If you need to customize the proxy behavior:

1. Modify `proxy-server.js` to change routing, headers, or error handling
2. Add additional middleware for specific features (e.g., caching, rate limiting)
3. Add new endpoints as needed for specific use cases

Remember to redeploy after making changes.