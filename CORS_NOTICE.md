# CORS Configuration Notice

## CORS Proxy Solution

This frontend includes a CORS proxy solution that helps avoid CORS issues when communicating with the backend API. 

### How It Works

1. The CORS proxy intercepts API requests
2. It routes them through a public CORS proxy server
3. The proxy adds necessary CORS headers to bypass browser restrictions

### Configuration

To enable or disable the CORS proxy, use the environment variable:

```
REACT_APP_USE_CORS_PROXY=true   # Enable CORS proxy (default)
REACT_APP_USE_CORS_PROXY=false  # Disable CORS proxy
```

### When to Use

- **Enable the proxy** when deploying to a different domain than your backend
- **Disable the proxy** when both frontend and backend share the same domain

### Deployment Configuration

When deploying to Railway or other platforms, make sure to set these environment variables:

1. `REACT_APP_API_URL` = Your backend API URL (e.g., `https://web-copy-production-5b48.up.railway.app`)
2. `REACT_APP_USE_CORS_PROXY` = `true` (to enable the proxy)

This configuration is already set in the provided `.env` file, but you should verify it in your deployment platform's settings.