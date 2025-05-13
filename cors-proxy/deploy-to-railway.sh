#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}       OfficeSTONKs CORS Proxy Deployment Script       ${NC}"
echo -e "${BLUE}=======================================================${NC}"

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

# Check if project is linked, if not, create a new project or link to an existing one
echo -e "${YELLOW}Checking project link status...${NC}"
railway project || {
  echo -e "${YELLOW}No project linked. Creating a new project or linking to an existing one...${NC}"
  
  # Ask if user wants to create a new project or link to existing
  echo -e "${BLUE}Do you want to create a new project or link to an existing one?${NC}"
  echo -e "1) Create new project"
  echo -e "2) Link to existing project"
  read -p "Enter your choice (1 or 2): " project_choice
  
  if [[ "$project_choice" == "1" ]]; then
    echo -e "${YELLOW}Creating new Railway project...${NC}"
    railway project create
  else
    echo -e "${YELLOW}Please select an existing project to link to:${NC}"
    railway project
  fi
}

# Create railway.json configuration if it doesn't exist
if [[ ! -f "railway.json" ]]; then
  echo -e "${YELLOW}Creating Railway configuration...${NC}"
  cat > railway.json << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
EOF
  echo -e "${GREEN}Railway configuration created!${NC}"
fi

# Set environment variables for Railway
echo -e "${YELLOW}Setting environment variables...${NC}"
railway variables --set "BACKEND_URL=https://web-production-1e26.up.railway.app" --set "NODE_ENV=production"

# Deploy to Railway
echo -e "${YELLOW}Deploying CORS proxy to Railway...${NC}"
railway up

echo -e "${GREEN}CORS proxy deployed to Railway!${NC}"
echo -e "Check the Railway dashboard for your application URL."
echo -e "Expected URL: https://officestonks-cors-proxy.up.railway.app"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}           Deployment completed successfully!          ${NC}"
echo -e "${BLUE}=======================================================${NC}"