# Deploying the Frontend to Railway

This guide explains how to deploy the OfficeStonks frontend to Railway as a separate service within the same project as the backend.

## Benefits of Deploying Frontend to Railway

1. **CORS Resolution**: Having both services under the same domain can eliminate CORS issues entirely.
2. **Simplified Deployment**: Manage both services from one Railway dashboard.
3. **Shared Environment**: Share environment variables between frontend and backend.
4. **Performance**: Railway CDN provides fast delivery of static assets.

## Deployment Steps

### 1. Create a New Service in Existing Project

1. Go to your Railway dashboard
2. Open the existing OfficeStonks project
3. Click "New Service" → "GitHub Repo"
4. Select your frontend repository

### 2. Configure Environment Variables

Add the following environment variables:

```
REACT_APP_API_URL=https://your-railway-project.up.railway.app
REACT_APP_USE_CORS_PROXY=false
```

* If using a shared domain, you can use a relative path for API_URL:
  ```
  REACT_APP_API_URL=/api
  ```

### 3. Configure Domain Settings

1. Go to the "Settings" tab for your frontend service
2. Under "Domains," click "Generate Domain"
3. (Optional) For custom domains, follow Railway's instructions to set up DNS

### 4. Set up Railway Project Domain (Optional but Recommended)

To share a domain between services:

1. Go to the project settings (not service settings)
2. Under "Domains," add a custom domain
3. Configure services to use different base paths
   - Backend: `/api/*`  
   - Frontend: `/*`

## Troubleshooting

If you experience deployment issues:

1. **Build Failures**: Check the build logs for errors 
2. **Serving Issues**: Verify that `serve` is properly handling routes
3. **Environment Variables**: Ensure the variables are correctly set and available at build time

## Alternative Deployment Options

If Railway deployment issues persist, consider:

1. **Vercel**: Optimized for frontend deployments
2. **Netlify**: Great for static sites 
3. **GitHub Pages**: Simple, free option

## CORS Fallback

If sharing domains isn't possible, enable the CORS proxy solution:

```
REACT_APP_USE_CORS_PROXY=true
```

This routes API requests through a proxy to bypass CORS restrictions.