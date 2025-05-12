#!/bin/bash

# Office Stonks Frontend Deployment Script
# This script provides deployment options for Railway, Vercel, or local testing

show_help() {
    echo "Office Stonks Frontend Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  railway    Deploy to Railway"
    echo "  vercel     Prepare and deploy to Vercel"
    echo "  github     Setup for GitHub repository"
    echo "  start      Start the frontend locally with Nginx"
    echo "  docker     Build Docker image"
    echo "  help       Show this help message"
    echo ""
    echo "Example: ./deploy.sh railway"
}

setup_env() {
    echo "Setting up environment variables..."
    echo "REACT_APP_API_URL=https://officestonks-proxy-production.up.railway.app" > .env
    echo "REACT_APP_USE_CORS_PROXY=true" >> .env
    
    echo "Environment configuration complete."
}

deploy_to_railway() {
    echo "=== Office Stonks Frontend Deployment to Railway ==="
    
    # Setup environment
    setup_env
    
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
    railway variables set REACT_APP_API_URL=https://officestonks-proxy-production.up.railway.app REACT_APP_USE_CORS_PROXY=true
    
    # Deploy the frontend
    echo "Deploying frontend to Railway..."
    railway up
    
    echo "=== Deployment Complete ==="
    echo "Your frontend with CORS proxy enabled should now be deployed to Railway."
    echo "You can view your deployment at: https://railway.app/dashboard"
}

deploy_to_vercel() {
    echo "=== Office Stonks Frontend Deployment to Vercel ==="
    
    # Ensure .env file is correct
    echo "REACT_APP_API_URL=https://officestonks-proxy-production.up.railway.app" > .env.production
    echo "REACT_APP_USE_CORS_PROXY=true" >> .env.production
    
    # Build the app
    echo "Building the app..."
    npm run build
    
    # Commit changes
    echo "Committing changes..."
    git add .env.production
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
}

setup_github() {
    echo "==== GitHub Repository Setup Guide ===="
    echo "Follow these steps to push this frontend to a new GitHub repository."
    echo ""
    echo "1. Create a new repository on GitHub:"
    echo "   - Go to https://github.com/new"
    echo "   - Name your repository (e.g., officestonks-frontend)"
    echo "   - Do NOT initialize with README, .gitignore, or license"
    echo "   - Click 'Create repository'"
    echo ""
    echo "2. Run the commands below (replace YOUR_USERNAME with your GitHub username):"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/officestonks-frontend.git"
    echo "   git push -u origin main"
    echo ""
    echo "3. Your repository is now on GitHub!"
    echo ""
    echo "Notes:"
    echo "- Railway is already configured via railway.json"
    echo "- The frontend is already built and ready to deploy"
    echo "- The API URL is configured in .env"
}

start_local() {
    echo "Starting frontend service locally..."
    
    # Install curl for healthcheck if not already installed
    if ! command -v curl > /dev/null; then
      echo "Installing curl for healthcheck..."
      apk add --no-cache curl
    fi
    
    # Start Nginx with detailed logging
    echo "Starting Nginx..."
    nginx -g 'daemon off;'
}

# Docker build function
build_docker() {
    echo "=== Building Docker image for Office Stonks Frontend ==="

    # Setup environment for Docker build
    setup_env

    # Build Docker image
    echo "Building Docker image..."
    docker build -t officestonks-frontend .

    echo "=== Docker Build Complete ==="
    echo "You can run the Docker image locally with:"
    echo "docker run -p 8080:8080 officestonks-frontend"
    echo ""
    echo "Or push to a registry with:"
    echo "docker tag officestonks-frontend [registry]/officestonks-frontend:[tag]"
    echo "docker push [registry]/officestonks-frontend:[tag]"
}

# Main script logic
case "$1" in
    railway)
        deploy_to_railway
        ;;
    vercel)
        deploy_to_vercel
        ;;
    github)
        setup_github
        ;;
    start)
        start_local
        ;;
    docker)
        build_docker
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Error: Unknown option: $1"
        show_help
        exit 1
        ;;
esac