FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
# Force install without using package-lock to resolve dependency conflicts
RUN npm install

# Copy the rest of the application code
COPY . ./

# Build the application for production
ENV REACT_APP_API_URL=https://officestonks-cors-proxy.up.railway.app
ENV REACT_APP_USE_CORS_PROXY=true
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create startup script directly
RUN echo '#!/bin/sh' > /start.sh && \
    echo '# Start script for Railway deployment' >> /start.sh && \
    echo 'echo "Starting frontend service..."' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Install curl for healthcheck if not already installed' >> /start.sh && \
    echo 'if ! command -v curl > /dev/null; then' >> /start.sh && \
    echo '  echo "Installing curl for healthcheck..."' >> /start.sh && \
    echo '  apk add --no-cache curl' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Start Nginx with detailed logging' >> /start.sh && \
    echo 'echo "Starting Nginx..."' >> /start.sh && \
    echo 'nginx -g "daemon off;"' >> /start.sh && \
    chmod +x /start.sh

# Create a health check file
RUN echo "OK" > /usr/share/nginx/html/health

# Expose port 8080 (Railway expects this port by default)
EXPOSE 8080

# Add healthcheck
HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD curl -f http://localhost:8080/health || exit 1

# Use startup script as entrypoint
ENTRYPOINT ["/start.sh"]