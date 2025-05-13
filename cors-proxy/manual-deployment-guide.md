# Manual CORS Proxy Deployment Guide

Since we're facing issues with automatic deployment through the script, here's a manual guide to deploy the updated CORS proxy.

## Deployment Steps

1. **Log in to Railway**
   
   Visit https://railway.app and log in to your account.

2. **Navigate to the CORS Proxy Project**
   
   Find and select the existing CORS proxy project (should be named something like "officestonks-cors-proxy").

3. **Update the Code**
   
   There are two ways to update the code:

   **Option 1: Update via GitHub**
   - Push the changes to the GitHub repository linked to the project
   - Railway will automatically detect the changes and deploy them

   **Option 2: Manual Update**
   - Click on the "Settings" tab
   - Scroll down to "Deploy" section
   - Click "Deploy Now" to trigger a new deployment

4. **Verify Environment Variables**
   
   Ensure these environment variables are set:
   - `BACKEND_URL`: https://web-production-1e26.up.railway.app
   - `NODE_ENV`: production

   To check/update:
   - Click on the "Variables" tab
   - Verify the variables are set correctly
   - If needed, add or update variables

5. **Monitor Deployment**
   
   - Go to the "Deployments" tab
   - Monitor the latest deployment to ensure it completes successfully
   - Check the logs for any errors

6. **Verify the Deployment**
   
   - Once deployment is complete, click on the generated URL (should be something like https://officestonks-cors-proxy.up.railway.app)
   - Test the health endpoint by visiting https://officestonks-cors-proxy.up.railway.app/health
   - It should return a JSON response with status: "ok"

## Testing Admin Functionality

After deployment, test the admin functionality:

1. Log in to the application as an admin user
2. Try resetting stock prices 
3. Try clearing chat history
4. Check the browser developer console for any CORS errors

If issues persist, check the CORS proxy logs in Railway for more information.

## Files Changed

The key files we've updated:

1. `/cors-proxy/proxy-server.js`:
   - Enhanced CORS configuration to work with credentials
   - Improved error handling
   - Better logging

2. `/cors-proxy/package.json`:
   - Added version information

3. New testing and documentation files:
   - `/cors-proxy/test-cors-proxy.js` - A test script
   - `/cors-proxy/DEPLOYMENT_INSTRUCTIONS.md` - Detailed deployment guide
   - `/ADMIN_ENDPOINT_CORS_FIX.md` - Overall documentation of the fix

## Troubleshooting

If you encounter issues:

1. **CORS Errors in Browser**
   - Check browser console for specific error messages
   - Verify that the CORS proxy is returning the correct headers
   - Try clearing browser cache and cookies

2. **Deployment Failures**
   - Check Railway logs for error messages
   - Verify the package.json file is valid
   - Check for any syntax errors in proxy-server.js

3. **Admin Functions Still Not Working**
   - Verify you're using the correct admin credentials
   - Check that the frontend is correctly pointing to the CORS proxy
   - Test the API endpoints directly using a tool like Postman