const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = process.env.PORT || 3000;

// IMPORTANT: Enable CORS for ALL routes and requests - no restrictions
app.use((req, res, next) => {
  // Get origin
  const origin = req.headers.origin;
  
  // Always allow the origin
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`CORS headers set for ${req.method} ${req.url} from origin: ${origin || 'unknown'}`);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
});

// Backup CORS middleware - double protection
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
  optionsSuccessStatus: 204, // Return 204 for preflight success
  maxAge: 86400 // 24 hours cache for preflight results
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

// Health check endpoint with permissive CORS headers
app.get('/health', (req, res) => {
  // Add CORS headers explicitly - allowing ALL origins for this endpoint
  const origin = req.headers.origin;
  
  // Always allow any origin for this specific endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // Don't use credentials with wildcard origin
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`Health check request from origin: ${origin || 'unknown'}`);
  
  // Send health status response
  res.json({
    status: 'ok',
    service: 'CORS Proxy',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    cors_enabled: true
  });
});

// Special health check endpoint with permissive CORS - alternative path
app.get('/api/health-check', (req, res) => {
  // Add CORS headers explicitly - allowing ALL origins for this endpoint
  const origin = req.headers.origin;
  
  // Always allow any origin for this specific endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // Don't use credentials with wildcard origin
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`API health check request from origin: ${origin || 'unknown'}`);
  
  // For OPTIONS requests, just respond OK immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Send health status response
  res.json({
    status: 'ok',
    service: 'CORS Proxy',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    cors_enabled: true
  });
});

// Configure proxy middleware - make sure it points to the correct backend URL
const backendUrl = process.env.BACKEND_URL || 'https://officestonks-backend-production.up.railway.app';
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

// Special direct route for news endpoint - TEMPORARY FIX
app.get('/api/news-direct', (req, res) => {
  const limit = req.query.limit || 20;
  const offset = req.query.offset || 0;
  
  // Add CORS headers explicitly - allowing ALL origins for this endpoint
  const origin = req.headers.origin;
  
  // Always allow any origin for this specific endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // Don't use credentials with wildcard origin
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log(`Direct news request from origin: ${origin || 'unknown'}`);
  
  // For OPTIONS requests, just respond OK immediately
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  // Forward to backend news endpoint
  console.log(`Proxying to ${backendUrl}/api/news?limit=${limit}&offset=${offset}`);
  
  // If backend API fails, return sample data
  const sampleNewsData = [
    {
      id: "market-event-1",
      headline: "Market Event: Federal Reserve Cuts Interest Rates",
      summary: "The Federal Reserve announced a 0.25% cut in interest rates, citing economic concerns.",
      event_type: "market_event",
      importance: 5,
      published_at: new Date().toISOString(),
      price_impact: 0.05
    },
    {
      id: "sector-event-1",
      headline: "Sector Event: Technology Stocks Rally on AI Advancements",
      summary: "Technology sector stocks are rallying following announcements of major AI breakthroughs.",
      event_type: "sector_event",
      importance: 4,
      published_at: new Date().toISOString(),
      price_impact: 0.03,
      related_sectors: ["Technology", "Software"]
    }
  ];

  fetch(`${backendUrl}/api/news?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': origin || 'https://officestonks-frontend-production.up.railway.app',
      'Authorization': req.headers.authorization || ''
    },
    // Add timeout to prevent long hanging requests
    signal: AbortSignal.timeout(5000) // 5 second timeout
  })
  .then(response => {
    if (!response.ok) {
      console.warn(`Backend news endpoint returned ${response.status}`);
      throw new Error(`Backend responded with ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(`News data received, ${Array.isArray(data) ? data.length : 0} items`);
    
    if (Array.isArray(data) && data.length > 0) {
      res.json(data);
    } else {
      console.warn('Backend returned empty or invalid data, using sample data');
      res.json(sampleNewsData);
    }
  })
  .catch(error => {
    console.error('Error fetching news from backend:', error);
    console.log('Returning sample news data instead');
    
    // On any error, return sample data instead of error
    res.json(sampleNewsData);
  });
});

// Add a direct endpoint for accessing the backend health check endpoint
app.get('/api/health-direct', (req, res) => {
  // Forward to backend health check
  fetch(`${backendUrl}/api/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Origin': req.headers.origin || 'https://officestonks-frontend-production.up.railway.app'
    }
  })
  .then(response => response.json())
  .then(data => {
    res.json({
      proxy_status: 'ok',
      backend_health: data,
      backend_url: backendUrl,
      timestamp: new Date().toISOString()
    });
  })
  .catch(error => {
    res.status(500).json({
      proxy_status: 'ok',
      backend_status: 'error',
      error: error.message,
      backend_url: backendUrl,
      timestamp: new Date().toISOString()
    });
  });
});

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