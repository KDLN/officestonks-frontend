#!/bin/bash

echo "=== Office Stonks Frontend Deployment Script ==="
echo "This script will help you deploy the frontend to Railway."

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

# Deploy the frontend
echo "Deploying frontend to Railway..."
railway up

echo "=== Deployment Complete ==="
echo "Your frontend should now be deployed to Railway."
echo "You can view your deployment at: https://railway.app/dashboard"