const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all requests with expanded configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // List of allowed origins for CORS
    const allowedOrigins = [
      'https://officestonks-frontend-production.up.railway.app',
      'https://officestonks-frontend.up.railway.app',
      'http://localhost:3000'
    ];
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, origin);
    } else {
      // For development, allow any origin
      if (process.env.NODE_ENV === 'development') {
        callback(null, origin);
      } else {
        console.log(`Origin ${origin} not allowed by CORS`);
        callback(null, allowedOrigins[0]); // Default to main production origin
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true, // Allow credentials
  preflightContinue: false, // Handle preflight ourselves
  optionsSuccessStatus: 204 // Return 204 for preflight success
}));

// Special handler for OPTIONS requests (preflight)
app.options('*', (req, res) => {
  // Set CORS headers for preflight requests
  const origin = req.headers.origin;
  
  // List of allowed origins for CORS
  const allowedOrigins = [
    'https://officestonks-frontend-production.up.railway.app',
    'https://officestonks-frontend.up.railway.app',
    'http://localhost:3000'
  ];
  
  // Check if origin is allowed
  if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
  } else {
    console.log(`Origin ${origin} not allowed by CORS in preflight`);
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.setHeader('Vary', 'Origin'); // Important when using specific origins

  console.log(`Explicit OPTIONS handler for: ${req.url} from origin: ${origin || 'unknown'}`);
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CORS Proxy',
    timestamp: new Date().toISOString()
  });
});

// Configure proxy middleware
const backendUrl = process.env.BACKEND_URL || 'https://web-production-1e26.up.railway.app';
console.log(`Proxy configured to forward requests to: ${backendUrl}`);

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} from ${req.headers.origin || 'unknown'}`);
  next();
});

// WebSocket proxy for /ws endpoints
app.use('/ws', createProxyMiddleware({
  target: backendUrl,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxy
  pathRewrite: {
    '^/ws': '/ws' // Keep the /ws path
  },
  // Special handling for WebSocket upgrade
  onProxyReq: (proxyReq, req, res) => {
    // Log WebSocket connection attempt
    console.log(`Proxying WebSocket initial request to: ${backendUrl}/ws`);
    console.log(`  Origin: ${req.headers.origin || 'unknown'}`);

    // Copy authentication token if present
    const token = req.query.token;
    if (token) {
      console.log('  Authentication token present');
    }
  },
  // Handle WebSocket specific errors
  onError: (err, req, res) => {
    console.error('WebSocket proxy error:', err);
    // Try to send error if headers not sent yet
    if (!res.headersSent) {
      res.status(502).json({
        error: 'WebSocket Proxy Error',
        message: err.message,
        code: 'WS_PROXY_ERROR'
      });
    }
  },
  // Log when WebSocket connection is established
  onProxyRes: (proxyRes, req, res) => {
    console.log(`WebSocket response status: ${proxyRes.statusCode}`);
  }
}));

// Create proxy middleware configuration for all API routes
const apiProxyConfig = {
  target: backendUrl,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Log each API request for debugging
    console.log(`Proxying request: ${req.method} ${req.url}`);
    console.log(`  To: ${backendUrl}${req.path}`);
    console.log(`  From origin: ${req.headers.origin || 'unknown'}`);

    // Preserve original headers
    if (req.headers.authorization) {
      console.log('  Authorization header present');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Always ensure CORS headers are present in every response
    const origin = req.headers.origin;
    
    // List of allowed origins for CORS
    const allowedOrigins = [
      'https://officestonks-frontend-production.up.railway.app',
      'https://officestonks-frontend.up.railway.app',
      'http://localhost:3000'
    ];
    
    // Check if origin is allowed
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
    } else {
      console.log(`Origin ${origin} not allowed by CORS in response`);
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Add Vary header to tell browsers to vary the cache based on the Origin header
    res.setHeader('Vary', 'Origin');

    // For OPTIONS preflight requests, ensure it succeeds without additional processing
    if (req.method === 'OPTIONS') {
      console.log(`Responding to OPTIONS preflight request for ${req.url} from origin: ${origin || 'unknown'}`);
      res.statusCode = 204; // No Content status is standard for successful preflight
    }

    // Log response status for debugging
    console.log(`API response status: ${proxyRes.statusCode} for ${req.method} ${req.url} from origin: ${origin || 'unknown'}`);
  },
  onError: (err, req, res) => {
    console.error('API proxy error:', err);
    console.error(`  Failed request: ${req.method} ${req.url}`);

    if (!res.headersSent) {
      res.status(502).json({
        error: 'API Proxy Error',
        message: err.message,
        code: 'API_PROXY_ERROR',
        path: req.url
      });
    }
  }
};

// Handle standard API endpoints
app.use('/api', createProxyMiddleware({
  ...apiProxyConfig,
  pathRewrite: {
    '^/api': '/api' // Keep the /api path
  }
}));

// Handle admin endpoints directly, ensuring they work with or without /api prefix
app.use('/admin', createProxyMiddleware({
  ...apiProxyConfig,
  pathRewrite: {
    '^/admin': '/api/admin' // Rewrite /admin to /api/admin
  }
}));

// Also explicitly handle /api/admin endpoints to ensure both paths work
app.use('/api/admin', createProxyMiddleware({
  ...apiProxyConfig,
  pathRewrite: {
    '^/api/admin': '/api/admin' // Keep the path as is
  }
}));

// Handle unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'Use /api/* to proxy API requests or /ws for WebSocket connections' 
  });
});

// Start the server
app.listen(port, () => {
  console.log(`CORS Proxy running on port ${port}`);
  console.log(`Proxying to backend: ${backendUrl}`);
});