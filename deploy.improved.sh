#!/bin/bash
set -e

# Enhanced deployment script for OfficeStonks Frontend
# Supports multiple environments and deployment targets

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
TARGET="local"
API_URL="http://localhost:8080"
USE_CORS_PROXY="false"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Show help message
show_help() {
  echo -e "${BLUE}OfficeStonks Frontend Deployment Script${NC}"
  echo -e "Usage: ./deploy.improved.sh [options]"
  echo
  echo -e "Options:"
  echo -e "  -e, --environment <env>     Set environment: development, staging, production (default: development)"
  echo -e "  -t, --target <target>       Set deployment target: local, docker, railway, vercel (default: local)"
  echo -e "  -a, --api-url <url>         Set API URL (default: http://localhost:8080)"
  echo -e "  -p, --use-cors-proxy        Use CORS proxy (default: false)"
  echo -e "  -h, --help                  Show this help message"
  echo
  echo -e "Examples:"
  echo -e "  ./deploy.improved.sh                                  # Deploy locally in development mode"
  echo -e "  ./deploy.improved.sh -e production -t railway         # Deploy to Railway in production mode"
  echo -e "  ./deploy.improved.sh -e staging -t docker -p          # Deploy to Docker in staging mode with CORS proxy"
  echo -e "  ./deploy.improved.sh -a https://api.example.com       # Deploy with custom API URL"
  echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -t|--target)
      TARGET="$2"
      shift 2
      ;;
    -a|--api-url)
      API_URL="$2"
      shift 2
      ;;
    -p|--use-cors-proxy)
      USE_CORS_PROXY="true"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo -e "${RED}Error: Invalid environment: $ENVIRONMENT${NC}"
  echo -e "Valid environments: development, staging, production"
  exit 1
fi

# Validate target
if [[ "$TARGET" != "local" && "$TARGET" != "docker" && "$TARGET" != "railway" && "$TARGET" != "vercel" ]]; then
  echo -e "${RED}Error: Invalid target: $TARGET${NC}"
  echo -e "Valid targets: local, docker, railway, vercel"
  exit 1
fi

# Set API URL based on environment if not explicitly provided
if [[ "$API_URL" == "http://localhost:8080" ]]; then
  if [[ "$ENVIRONMENT" == "production" ]]; then
    API_URL="https://officestonks-production.up.railway.app"
    USE_CORS_PROXY="true"
  elif [[ "$ENVIRONMENT" == "staging" ]]; then
    API_URL="https://officestonks-staging.up.railway.app"
    USE_CORS_PROXY="true"
  fi
fi

# Display deployment info
echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}       OfficeStonks Frontend Deployment Script         ${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${YELLOW}Environment:${NC} $ENVIRONMENT"
echo -e "${YELLOW}Target:${NC} $TARGET"
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Use CORS Proxy:${NC} $USE_CORS_PROXY"
echo -e "${BLUE}=======================================================${NC}"
echo

# Create .env file
echo -e "${YELLOW}Setting up environment variables...${NC}"
cat > .env << EOF
REACT_APP_API_URL=$API_URL
REACT_APP_USE_CORS_PROXY=$USE_CORS_PROXY
EOF

# Deploy based on target
case "$TARGET" in
  local)
    echo -e "${YELLOW}Deploying locally...${NC}"
    
    # Install dependencies
    npm install
    
    # Start the application
    npm start
    ;;
    
  docker)
    echo -e "${YELLOW}Deploying with Docker...${NC}"
    
    # Build Docker image
    docker build -t officestonks-frontend \
      --build-arg API_URL="$API_URL" \
      --build-arg USE_CORS_PROXY="$USE_CORS_PROXY" \
      .
    
    # Run Docker container
    docker run -d \
      --name officestonks-frontend \
      -p 3000:8080 \
      officestonks-frontend
    
    echo -e "${GREEN}Frontend deployed with Docker!${NC}"
    echo -e "Available at: http://localhost:3000"
    ;;
    
  railway)
    echo -e "${YELLOW}Deploying to Railway...${NC}"
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
      echo -e "${RED}Railway CLI not found. Please install it with:${NC}"
      echo -e "npm i -g @railway/cli"
      exit 1
    fi
    
    # Verify Railway login status
    echo -e "${YELLOW}Checking Railway login status...${NC}"
    railway whoami || {
      echo -e "${RED}Not logged in to Railway. Please run 'railway login' first.${NC}"
      exit 1
    }
    
    # Using improved Railway configuration
    cp railway.improved.json railway.json
    
    # Set environment variables for Railway
    railway variables set \
      REACT_APP_API_URL="$API_URL" \
      REACT_APP_USE_CORS_PROXY="$USE_CORS_PROXY"
    
    # Deploy to Railway
    railway up
    
    echo -e "${GREEN}Frontend deployed to Railway!${NC}"
    echo -e "Check the Railway dashboard for your application URL."
    ;;
    
  vercel)
    echo -e "${YELLOW}Preparing for Vercel deployment...${NC}"
    
    # Create a production build
    echo -e "${YELLOW}Building the application...${NC}"
    npm run build
    
    # Create Vercel configuration if it doesn't exist
    if [[ ! -f "vercel.json" ]]; then
      cat > vercel.json << EOF
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "$API_URL/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "REACT_APP_API_URL": "$API_URL",
    "REACT_APP_USE_CORS_PROXY": "$USE_CORS_PROXY"
  }
}
EOF
    fi
    
    echo -e "${GREEN}Application prepared for Vercel deployment!${NC}"
    echo -e "To deploy to Vercel:"
    echo -e "1. Install Vercel CLI: npm i -g vercel"
    echo -e "2. Run: vercel login"
    echo -e "3. Run: vercel"
    echo -e "Or use the Vercel dashboard to deploy from your GitHub repository."
    ;;
esac

echo
echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}           Deployment completed successfully!          ${NC}"
echo -e "${BLUE}=======================================================${NC}"