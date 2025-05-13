#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${BLUE}      Creating CORS Proxy Deployment Package          ${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Create a temporary directory for the deployment package
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Creating temporary directory: ${TEMP_DIR}${NC}"

# Copy all necessary files to the deployment package
echo -e "${YELLOW}Copying files to deployment package...${NC}"
cp proxy-server.js "${TEMP_DIR}/"
cp package.json "${TEMP_DIR}/"
cp test-cors-proxy.js "${TEMP_DIR}/"

# Create a simple README.md for the deployment
cat > "${TEMP_DIR}/README.md" << EOF
# CORS Proxy for OfficeSTONKs

This package contains the CORS proxy implementation for the OfficeSTONKs application.

## Environment Variables

- \`BACKEND_URL\`: URL of the backend API (default: https://web-production-1e26.up.railway.app)
- \`PORT\`: Port to run the proxy on (default: 3000)
- \`NODE_ENV\`: Environment mode (development/production)

## Files

- \`proxy-server.js\`: The main proxy server implementation
- \`package.json\`: Node.js package configuration
- \`test-cors-proxy.js\`: Test script for verifying CORS configuration
EOF

# Create a railway.json file for deployment configuration
cat > "${TEMP_DIR}/railway.json" << EOF
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

# Create a start.sh script
cat > "${TEMP_DIR}/start.sh" << EOF
#!/bin/bash
echo "Starting CORS Proxy..."
BACKEND_URL=\${BACKEND_URL:-https://web-production-1e26.up.railway.app}
echo "Using backend URL: \$BACKEND_URL"
node proxy-server.js
EOF

# Make start.sh executable
chmod +x "${TEMP_DIR}/start.sh"

# Create a .gitignore file
cat > "${TEMP_DIR}/.gitignore" << EOF
node_modules/
npm-debug.log
.DS_Store
.env
EOF

# Create a ZIP file for easy deployment
ZIP_FILE="cors-proxy-deployment.zip"
echo -e "${YELLOW}Creating deployment package ZIP file: ${ZIP_FILE}${NC}"
(cd "${TEMP_DIR}" && zip -r "../${ZIP_FILE}" *)

echo -e "${GREEN}Deployment package created successfully: ${ZIP_FILE}${NC}"
echo -e "${GREEN}You can now upload this file to Railway manually${NC}"
echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}               Package creation complete              ${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Clean up the temporary directory
echo -e "${YELLOW}Cleaning up temporary directory...${NC}"
rm -rf "${TEMP_DIR}"