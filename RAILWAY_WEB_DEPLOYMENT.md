# Deploying to Railway via Web UI

If you prefer to deploy using the Railway web dashboard instead of the CLI, follow these steps:

## Step 1: Push Your Code to GitHub

Make sure your code is pushed to GitHub with the CORS proxy changes:

```bash
# Ensure environment variables are set for CORS proxy
echo "REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app" > .env
echo "REACT_APP_USE_CORS_PROXY=true" >> .env

# Commit and push
git add .env
git commit -m "Enable CORS proxy for Railway deployment"
git push origin main
```

## Step 2: Create a New Service in Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your project (or create a new one)
3. Click "New Service" -> "GitHub Repo"
4. Find and select your frontend repository
5. Click "Deploy" to start the initial deployment

## Step 3: Configure Environment Variables

1. After deployment starts, go to the "Variables" tab for your service
2. Add the following environment variables:
   - `REACT_APP_API_URL` = `https://web-copy-production-5b48.up.railway.app`
   - `REACT_APP_USE_CORS_PROXY` = `true`
3. Click "Deploy" to apply these changes

## Step 4: Configure Domain

1. Go to the "Settings" tab for your service
2. Under "Domains", click "Generate Domain"
3. Railway will provide a domain like `https://your-app-name.up.railway.app`
4. Use this URL to access your frontend

## Step 5: Test Your Deployment

1. Visit your Railway-generated domain
2. Try logging in or registering
3. Check browser's developer console (F12) for any remaining CORS errors
4. If you see any errors, verify that:
   - Environment variables are set correctly
   - The backend is running and accessible
   - The CORS proxy is functioning

## Troubleshooting

If you encounter issues:

1. **Build Errors**: Check the "Deployments" tab for build logs
2. **CORS Errors**: Make sure `REACT_APP_USE_CORS_PROXY` is set to `true`
3. **API Connection Issues**: Verify the backend URL is correct
4. **Missing Dependencies**: Ensure all dependencies are in package.json

## Next Steps

Once deployed successfully:

1. Share the frontend URL with your team or users
2. Consider setting up a custom domain (available in Railway's paid plans)
3. Set up automatic deployments from your GitHub repository