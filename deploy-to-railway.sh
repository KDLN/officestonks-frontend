#!/bin/bash

echo "=== Office Stonks Frontend Deployment Script ==="
echo "This script will help you deploy the frontend to Railway with CORS proxy enabled."

# Ensure environment variables are set for CORS proxy
echo "Setting up environment variables..."
echo "REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app" > .env
echo "REACT_APP_USE_CORS_PROXY=true" >> .env

# Commit the changes
echo "Committing changes..."
git add .env
git commit -m "Enable CORS proxy for Railway deployment"
git push origin main

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm i -g @railway/cli
fi

# Check if logged in to Railway
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "Please log in to Railway:"
    railway login
fi

# Select the Railway project
echo "Selecting Railway project..."
railway link

# Set environment variables in Railway
echo "Setting environment variables in Railway..."
railway variables set REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app REACT_APP_USE_CORS_PROXY=true

# Deploy the frontend
echo "Deploying frontend to Railway..."
railway up

echo "=== Deployment Complete ==="
echo "Your frontend with CORS proxy enabled should now be deployed to Railway."
echo "You can view your deployment at: https://railway.app/dashboard"