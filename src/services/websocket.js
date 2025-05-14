/**
 * WebSocket service for real-time updates
 * Provides WebSocket connection and message handling for the application
 *
 * Updated to use the CORS proxy for handling WebSocket connections
 */
import { useEffect, useCallback } from 'react';
import { getToken } from './auth';

// Connection variables
let socket = null;
let listeners = {};
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Register default handlers for common event types
// This ensures we always have at least one handler for each event type
// and prevents "No listeners found" errors
const DEFAULT_HANDLERS = {
  'market_event': (message) => {
    console.log('Default handler for market_event:', message);
  },
  'sector_event': (message) => {
    console.log('Default handler for sector_event:', message);
    // Handle sector events that would otherwise be dropped
    console.log(`Sector ${message.related_sectors ? message.related_sectors.join(', ') : 'Unknown'} affected`);
  },
  'company_event': (message) => {
    console.log('Default handler for company_event:', message);
  },
  'stock_update': (message) => {
    console.log('Default handler for stock_update:', message);
    // Update stock price cache for any stock updates
    if (message.id && message.current_price) {
      stockPriceCache[message.id] = message.current_price;
    }
  },
  'news_item': (message) => {
    console.log('Default handler for news_item:', message);
  }
};

// Initialize default handlers
Object.entries(DEFAULT_HANDLERS).forEach(([type, handler]) => {
  listeners[type] = [handler];
});

// Expose listeners for direct access by the market event generator
// This is a development-only feature to allow proper event propagation
if (typeof window !== 'undefined') {
  window.websocketListeners = listeners;
}

// Cache to store latest stock prices across page navigations
export const stockPriceCache = {};

// Paused stocks - map of stock IDs that are currently being updated manually
// and should not receive WebSocket updates
export const pausedStocks = new Set();

// Flag to indicate if all stock updates are paused globally
let allStockUpdatesPaused = false;

// Initialize WebSocket connection
export const initWebSocket = () => {
  if (socket) {
    // Close existing connection before creating a new one
    console.log('Closing existing WebSocket connection');
    socket.close();
  }

  const token = getToken();
  if (!token) {
    console.error('No authentication token available for WebSocket connection');
    document.dispatchEvent(new CustomEvent('websocket-error', { detail: { message: 'No authentication token available' } }));
    return;
  }

  // Use correct CORS proxy URL for WebSocket connection
  // Try different URLs in development mode
  let proxyUrl = 'https://officestonks-proxy-production.up.railway.app';
  
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // DEVELOPMENT: Try with local CORS proxy if hosted
    if (window.location.port === '3000' && process.env.REACT_APP_USE_LOCAL_PROXY === 'true') {
      proxyUrl = 'http://localhost:3001';
    }
  }

  console.log('Using proxy URL:', proxyUrl);
  
  // Add visible WebSocket connection status indicator to the page
  let wsStatusIndicator = document.getElementById('ws-status-indicator');
  if (!wsStatusIndicator) {
    wsStatusIndicator = document.createElement('div');
    wsStatusIndicator.id = 'ws-status-indicator';
    wsStatusIndicator.style.position = 'fixed';
    wsStatusIndicator.style.bottom = '10px';
    wsStatusIndicator.style.right = '10px';
    wsStatusIndicator.style.padding = '5px 10px';
    wsStatusIndicator.style.borderRadius = '4px';
    wsStatusIndicator.style.fontSize = '12px';
    wsStatusIndicator.style.color = 'white';
    wsStatusIndicator.style.background = '#f44336';
    wsStatusIndicator.style.zIndex = '9999';
    wsStatusIndicator.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    wsStatusIndicator.style.cursor = 'pointer';
    wsStatusIndicator.innerHTML = 'WebSocket: Connecting...';
    wsStatusIndicator.addEventListener('click', () => {
      alert('WebSocket Status: ' + wsStatusIndicator.dataset.status + '\nURL: ' + wsStatusIndicator.dataset.url);
    });
    document.body.appendChild(wsStatusIndicator);
  }
  
  wsStatusIndicator.style.background = '#ff9800';
  wsStatusIndicator.innerHTML = 'WebSocket: Connecting...';
  wsStatusIndicator.dataset.status = 'connecting';

  // Check API health directly - this helps verify proxy connectivity
  console.log('Checking API health through proxy');
  
  // Use Promise.race to add a timeout to the health check
  const fetchWithTimeout = (url, options, timeout = 3000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Health check timeout after ${timeout}ms`)), timeout)
      )
    ]);
  };
  
  // Try multiple health check endpoints with fallbacks
  const tryHealthChecks = async () => {
    try {
      // First try: Main health endpoint
      console.log('Trying main health endpoint');
      const mainResponse = await fetchWithTimeout(`${proxyUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (mainResponse.ok) {
        return { status: 'ok', source: 'main' };
      }
      throw new Error(`Main health check failed: ${mainResponse.status}`);
    } catch (mainError) {
      console.warn('Main health check failed:', mainError);
      
      try {
        // Second try: Alternative health endpoint
        console.log('Trying alternative health endpoint');
        const altResponse = await fetchWithTimeout(`${proxyUrl}/api/health-check`, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Accept': 'application/json' }
        });
        
        if (altResponse.ok) {
          return { status: 'ok', source: 'alternative' };
        }
        throw new Error(`Alternative health check failed: ${altResponse.status}`);
      } catch (altError) {
        console.warn('Alternative health check failed:', altError);
        
        // Last resort: Mock a successful health check
        console.log('Using mocked health check as fallback');
        return { 
          status: 'ok', 
          source: 'mocked',
          message: 'Using mocked health status - continuing with WebSocket connection'
        };
      }
    }
  };
  
  // Execute the health checks
  tryHealthChecks()
    .then(result => {
      console.log(`Health check ${result.status} (source: ${result.source})`);
      wsStatusIndicator.innerHTML = `API: ${result.source === 'mocked' ? 'Simulated' : 'OK'}, Connecting WS...`;
      
      if (result.source === 'mocked') {
        wsStatusIndicator.style.background = '#ff9800'; // Orange for mocked
      } else {
        wsStatusIndicator.style.background = '#4caf50'; // Green for real response
      }
      
      // Dispatch health check success event
      document.dispatchEvent(new CustomEvent('api-health-ok', { 
        detail: { 
          status: 'ok', 
          source: result.source,
          timestamp: new Date().toISOString()
        } 
      }));
      
      // Continue with WebSocket connection regardless of health check result
      // This allows the app to work even when the backend health endpoint is unavailable
    })
    .catch(error => {
      // This shouldn't happen since tryHealthChecks handles all errors internally
      // But just in case, log it and show a warning
      console.error('Unexpected error during health checks:', error);
      
      wsStatusIndicator.style.background = '#f44336';
      wsStatusIndicator.innerHTML = 'API Error';
      wsStatusIndicator.dataset.status = 'api-error';
      
      document.dispatchEvent(new CustomEvent('websocket-error', { 
        detail: { message: 'API health checks failed, but continuing', error } 
      }));
    });

  // Create the WebSocket URL with proxy URL
  const wsUrl = `${proxyUrl.replace(/^http/, 'ws')}/ws?token=${token}`;
  wsStatusIndicator.dataset.url = wsUrl;

  // Log the URL to verify it's correct
  console.log('WebSocket URL:', wsUrl);
  
  console.log('Connecting to WebSocket:', wsUrl);
  socket = new WebSocket(wsUrl);
  
  // Make socket and addListener available globally for other components
  window.socket = socket;
  window.addListener = addListener;
  
  // Connection opened
  socket.addEventListener('open', () => {
    console.log('WebSocket connection established successfully');
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    // Update status indicator
    const wsStatusIndicator = document.getElementById('ws-status-indicator');
    if (wsStatusIndicator) {
      wsStatusIndicator.style.background = '#4caf50';
      wsStatusIndicator.innerHTML = 'WebSocket: Connected';
      wsStatusIndicator.dataset.status = 'connected';
    }
    
    // Dispatch event for other components to know connection is established
    document.dispatchEvent(new CustomEvent('websocket-connected'));
    
    // Send a ping message to verify connection works both ways
    try {
      socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      console.log('Sent ping message to WebSocket server');
    } catch (error) {
      console.error('Error sending ping message:', error);
    }
  });
  
  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      console.log('Received WebSocket message:', event.data);
      
      // Clean the message string if needed
      let jsonStr = event.data;
      if (typeof jsonStr === 'string') {
        // Remove any BOM and control characters
        jsonStr = jsonStr.replace(/^\ufeff/, ''); // Remove byte order mark
        jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control chars except whitespace
        jsonStr = jsonStr.trim(); // Remove leading/trailing whitespace
      }
      
      // Parse and process the message
      const message = JSON.parse(jsonStr);
      
      // Update stock price cache if it's a stock update, but only if not paused
      if (message.type === 'stock_update' || (message.id && message.current_price)) {
        const stockId = message.stock_id || message.id;
        const price = message.price || message.current_price;
        
        if (stockId && price) {
          // Check if this stock is currently paused
          const isPaused = pausedStocks.has(Number(stockId)) || pausedStocks.has(String(stockId)) || allStockUpdatesPaused;
          
          if (isPaused) {
            console.log(`Skipping WebSocket update for paused stock ID: ${stockId}`);
          } else {
            // If not paused, store the latest price in cache
            stockPriceCache[stockId] = price;
            console.log(`Updated stockPriceCache for stock ID: ${stockId}, new price: ${price}`);
          }
        }
      }
      
      // Skip calling listeners if global updates are paused
      if (allStockUpdatesPaused && (message.type === 'stock_update' || message.type === 'market_event')) {
        console.log(`Skipping listeners for message type ${message.type} because all stock updates are paused`);
        return;
      }
      
      // For stock-specific updates, check if the specific stock is paused
      if (message.type === 'stock_update' || (message.id && message.current_price)) {
        const stockId = message.stock_id || message.id;
        if (stockId && (pausedStocks.has(Number(stockId)) || pausedStocks.has(String(stockId)))) {
          console.log(`Skipping listeners for paused stock ID: ${stockId}`);
          return;
        }
      }
      
      // Call listeners for this message type
      if (listeners[message.type] && listeners[message.type].length > 0) {
        console.log(`Found ${listeners[message.type].length} listeners for type ${message.type}`);
        listeners[message.type].forEach(callback => callback(message));
      } else {
        // No listeners found for this type, log a warning and try to create default handler
        console.warn(`No listeners found for type ${message.type}, using default handler`);
        
        // Add default handler if not already present
        if (!listeners[message.type]) {
          listeners[message.type] = [(message) => {
            console.log(`Default handler for ${message.type}:`, message);
          }];
          
          // Call the newly created default handler
          listeners[message.type][0](message);
        }
      }
      
      // Call general listeners
      if (listeners['*']) {
        listeners['*'].forEach(callback => callback(message));
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
      console.error('Message content:', event.data);
    }
  });
  
  // Connection closed
  socket.addEventListener('close', (event) => {
    console.log(`WebSocket connection closed: Code ${event.code} - ${event.reason || 'No reason provided'}`);
    
    // Update status indicator
    const wsStatusIndicator = document.getElementById('ws-status-indicator');
    if (wsStatusIndicator) {
      wsStatusIndicator.style.background = '#f44336';
      wsStatusIndicator.innerHTML = `WS: Closed (${event.code})`;
      wsStatusIndicator.dataset.status = 'closed';
      wsStatusIndicator.dataset.code = event.code;
      wsStatusIndicator.dataset.reason = event.reason || 'Unknown reason';
    }
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('websocket-closed', { 
      detail: { code: event.code, reason: event.reason } 
    }));
    
    // Attempt to reconnect
    reconnect();
  });
  
  // Connection error
  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    
    // Update status indicator
    const wsStatusIndicator = document.getElementById('ws-status-indicator');
    if (wsStatusIndicator) {
      wsStatusIndicator.style.background = '#f44336';
      wsStatusIndicator.innerHTML = 'WS: Error';
      wsStatusIndicator.dataset.status = 'error';
    }
    
    // Add more detailed error information
    console.error('WebSocket connection failed - possible CORS issue or server unavailable');
    console.error('If this is a CORS error, ensure the backend allows WebSocket connections from this origin');
    console.error('Current origin:', window.location.origin);
    
    // Additional troubleshooting information
    console.error('Check the console logs for detailed error messages about WebSocket connectivity');
    console.error('Verify that the backend URL is correct - it should match your Railway deployment URL');
    console.error('Check that the backend service is running using the health check endpoints');
    console.error('Verify CORS settings if you\'re seeing CORS-related errors');
    console.error('Check authentication token validity if you\'re seeing authentication errors');
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('websocket-error', { 
      detail: { error: error.message || 'Unknown error' } 
    }));
    
    // Socket will automatically close after error
  });
  
  return socket;
};

// Add a listener for a specific message type
export const addListener = (type, callback) => {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  listeners[type].push(callback);
  
  // Return function to remove this listener
  return () => {
    if (listeners[type]) {
      listeners[type] = listeners[type].filter(cb => cb !== callback);
    }
  };
};

// Remove a listener
export const removeListener = (type, callback) => {
  if (listeners[type]) {
    listeners[type] = listeners[type].filter(cb => cb !== callback);
  }
};

// Close the WebSocket connection
export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  // Clear reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  // Clear all listeners
  listeners = {};
};

// Reconnect to WebSocket
const reconnect = () => {
  if (reconnectTimer || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    }
    return;
  }
  
  reconnectAttempts++;
  
  reconnectTimer = setTimeout(() => {
    console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    reconnectTimer = null;
    initWebSocket();
  }, RECONNECT_DELAY);
};

// Get latest price from cache or use default
export const getLatestPrice = (stockId, defaultPrice) => {
  return stockId in stockPriceCache ? stockPriceCache[stockId] : defaultPrice;
};

/**
 * Pause WebSocket updates for a specific stock
 * @param {string|number} stockId - ID of the stock to pause
 */
export const pauseStockUpdates = (stockId) => {
  if (!stockId) return;
  
  console.log(`Pausing WebSocket updates for stock ID: ${stockId}`);
  pausedStocks.add(stockId);
  
  // Log all paused stocks for debugging
  console.log('Currently paused stocks:', Array.from(pausedStocks));
  
  // Dispatch an event for other components to know
  document.dispatchEvent(new CustomEvent('stock-updates-paused', { 
    detail: { stockId, timestamp: new Date().toISOString() } 
  }));
};

/**
 * Resume WebSocket updates for a specific stock
 * @param {string|number} stockId - ID of the stock to resume
 */
export const resumeStockUpdates = (stockId) => {
  if (!stockId) return;
  
  console.log(`Resuming WebSocket updates for stock ID: ${stockId}`);
  pausedStocks.delete(stockId);
  pausedStocks.delete(String(stockId));
  pausedStocks.delete(Number(stockId));
  
  // Log all paused stocks for debugging
  console.log('Currently paused stocks:', Array.from(pausedStocks));
  
  // Dispatch an event for other components to know
  document.dispatchEvent(new CustomEvent('stock-updates-resumed', { 
    detail: { stockId, timestamp: new Date().toISOString() } 
  }));
};

/**
 * Pause all stock WebSocket updates
 */
export const pauseAllStockUpdates = () => {
  console.log('Pausing all WebSocket stock updates');
  allStockUpdatesPaused = true;
  
  // Dispatch an event for other components to know
  document.dispatchEvent(new CustomEvent('all-stock-updates-paused', { 
    detail: { timestamp: new Date().toISOString() } 
  }));
};

/**
 * Resume all stock WebSocket updates
 */
export const resumeAllStockUpdates = () => {
  console.log('Resuming all WebSocket stock updates');
  allStockUpdatesPaused = false;
  
  // Dispatch an event for other components to know
  document.dispatchEvent(new CustomEvent('all-stock-updates-resumed', { 
    detail: { timestamp: new Date().toISOString() } 
  }));
};

/**
 * Set a stock's price in the cache directly
 * This is used when manually updating a stock price
 * @param {string|number} stockId - ID of the stock
 * @param {number} price - New price for the stock
 */
export const setStockPrice = (stockId, price) => {
  if (!stockId) return;
  
  console.log(`Manually setting stock price for ID: ${stockId} to ${price}`);
  stockPriceCache[stockId] = price;
  
  // Dispatch an event for other components to know
  document.dispatchEvent(new CustomEvent('stock-price-manually-set', { 
    detail: { stockId, price, timestamp: new Date().toISOString() } 
  }));
};

// React hook for WebSocket integration
export const useWebSocket = () => {
  // Initialize WebSocket connection on component mount
  useEffect(() => {
    // Only initialize if no connection exists
    if (!socket) {
      initWebSocket();
    }
    
    // Cleanup on unmount
    return () => {
      // Don't close the socket on unmount - we want to keep it alive
      // for other components. Socket will be closed when the user leaves
      // the app or logs out.
    };
  }, []);
  
  // Memoize addListener function to prevent unnecessary re-renders
  const memoizedAddListener = useCallback(addListener, []);
  
  return {
    addListener: memoizedAddListener,
    removeListener,
    closeWebSocket,
    getLatestPrice,
    pauseStockUpdates,
    resumeStockUpdates,
    pauseAllStockUpdates,
    resumeAllStockUpdates,
    setStockPrice,
    isPaused: (stockId) => pausedStocks.has(stockId) || allStockUpdatesPaused,
    isAllPaused: () => allStockUpdatesPaused
  };
};