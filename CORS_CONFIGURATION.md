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
   - You've included `credentials: 'include'`
   - The backend CORS configuration includes your frontend domain
   
2. **Authentication Issues**: If authorized requests fail:
   
   **Solution**: Ensure:
   - The token is properly retrieved from localStorage
   - The Authorization header is correctly formatted: `Bearer ${token}`

3. **Adding New Deployment Domains**:
   
   If you deploy the frontend to a new domain, you must:
   - Ask the backend team to add the new domain to the CORS allowlist in `cmd/api/cors.go`

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