# OfficeSTONKs Frontend Deployment Guide

This comprehensive guide covers all aspects of deploying and configuring the OfficeSTONKs frontend application, including CORS configuration, deployment options, and troubleshooting.

## Table of Contents
1. [Environment Configuration](#environment-configuration)
2. [CORS Configuration](#cors-configuration)
3. [Deployment Options](#deployment-options)
   - [Railway Deployment](#railway-deployment)
   - [Vercel Deployment](#vercel-deployment)
   - [GitHub Setup](#github-setup)
4. [API Configuration](#api-configuration)
5. [Authentication](#authentication)
6. [Troubleshooting](#troubleshooting)

## Environment Configuration

The frontend requires the following environment variables:

```
REACT_APP_API_URL=https://web-production-1e26.up.railway.app
REACT_APP_USE_CORS_PROXY=true
```

## CORS Configuration

### Overview

OfficeSTONKs has a frontend and backend deployed on different domains, requiring Cross-Origin Resource Sharing (CORS) configuration:

- Frontend may be deployed on Vercel (`https://officestonks-frontend.vercel.app`)
- Backend is deployed on Railway (`https://web-production-1e26.up.railway.app`)

### Frontend CORS Configuration

The frontend uses a centralized API configuration in `src/config/api.js`:

```javascript
// API route base
export const API_URL = isLocalhost ? '/api' : `${BACKEND_URL}/api`;
```

All API requests should use this configuration to ensure CORS compatibility.

### Authentication and CORS

All authenticated requests should:
1. Include the token as a query parameter `?token=<jwt_token>`
2. Do NOT include the Authorization header for admin endpoints

Example:
```javascript
const token = getToken();
const response = await fetch(`${API_URL}/admin/users?token=${token}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
    // No Authorization header for admin routes
  },
  mode: 'cors'
});
```

## Deployment Options

### Railway Deployment

To deploy to Railway, use:

```bash
./deploy.sh railway
```

This will:
1. Set up the environment variables
2. Deploy the application to Railway
3. Configure the necessary settings

### Vercel Deployment

To deploy to Vercel, use:

```bash
./deploy.sh vercel
```

This will:
1. Prepare the application for Vercel deployment
2. Build the frontend
3. Guide you through the Vercel deployment process

### GitHub Setup

To set up a GitHub repository:

```bash
./deploy.sh github
```

Follow the prompts to:
1. Create a new GitHub repository
2. Push your code
3. Configure deployment settings

## API Configuration

The API configuration is centralized in `src/config/api.js`:

- `API_URL`: Base URL for all API requests
- `WS_URL`: WebSocket URL for real-time updates
- `ENDPOINTS`: Collection of API endpoint paths

Admin endpoints should use the token in the URL query parameter:

```javascript
// Get all users (admin only)
export const getAllUsers = async () => {
  const token = getToken();
  const adminUrl = `${API_URL}/admin/users${token ? `?token=${token}` : ''}`;
  
  // API request code...
};
```

## Authentication

Authentication is handled via JWT tokens:

1. Login/Register obtain a token from the API
2. Token is stored in localStorage
3. Token is sent with all authenticated requests
4. Admin routes require special handling (token in query parameter)

## Troubleshooting

### CORS Errors

If you see CORS errors:

1. Check that environment variables are set correctly
2. Verify that admin routes are using the token in query parameter without Authorization header
3. Ensure all API requests use the centralized API configuration
4. Check browser console for specific error messages

### Authentication Issues

For 401 Unauthorized errors:

1. Verify the token is valid and not expired
2. Ensure the correct user has admin privileges (user ID 3 - KDLN)
3. Use the debug endpoint for admin JWT issues:
   ```javascript
   const token = getToken();
   const debugResponse = await fetch(`https://web-production-1e26.up.railway.app/debug-admin-jwt?token=${token}`);
   const debugData = await debugResponse.json();
   console.log('Token debug:', debugData);
   ```

### Deployment Issues

For deployment problems:

1. Check deployment logs in Railway or Vercel dashboard
2. Verify environment variables are set correctly in the deployment platform
3. Ensure build process completes successfully
4. Check for any dependencies or build script issues