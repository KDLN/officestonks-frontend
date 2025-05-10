#!/bin/bash
# Script to prepare and deploy the frontend to Vercel

echo "Preparing for Vercel deployment..."

# Ensure .env file is correct
echo "REACT_APP_API_URL=https://web-copy-production-5b48.up.railway.app" > .env.production
echo "REACT_APP_USE_CORS_PROXY=true" >> .env.production

# Build the app
echo "Building the app..."
npm run build

# Commit changes
echo "Committing changes..."
git add .env.production build
git commit -m "Prepare for Vercel deployment with CORS proxy"

# Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Deployment preparation complete! The app is ready to be deployed by Vercel."
echo ""
echo "Next steps:"
echo "1. Go to Vercel: https://vercel.com/new"
echo "2. Import your repository"
echo "3. Configure the project (no changes needed to default settings)"
echo "4. Click 'Deploy'"
echo ""
echo "Your app will be automatically deployed whenever you push to the main branch."