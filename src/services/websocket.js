/**
 * WebSocket service for real-time updates
 * Provides WebSocket connection and message handling for the application
 *
 * Updated to use the CORS proxy for handling WebSocket connections
 */
import { getToken } from './auth';

// Connection variables
let socket = null;
let listeners = {};
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Cache to store latest stock prices across page navigations
export const stockPriceCache = {};

// Initialize WebSocket connection
export const initWebSocket = () => {
  if (socket) {
    // Close existing connection before creating a new one
    socket.close();
  }

  const token = getToken();
  if (!token) {
    console.error('No authentication token available for WebSocket connection');
    return;
  }

  // HARDCODED: Use correct CORS proxy URL for WebSocket connection
  const proxyUrl = 'https://officestonks-proxy-production.up.railway.app';

  // Check API health directly
  fetch(`${proxyUrl}/api/health`, {
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Accept': 'application/json',
    }
  })
    .then(response => {
      if (!response.ok) {
        console.error(`Backend health check failed: ${response.status} ${response.statusText}`);
      } else {
        console.log('Backend health check passed');
        return response.json();
      }
    })
    .then(data => {
      if (data) console.log('Backend status:', data);
    })
    .catch(error => {
      console.error('Backend health check error:', error);
      console.error('Backend API server may be unreachable - check server status');
    });

  // HARDCODED: Create the WebSocket URL with explicit proxy URL
  const wsUrl = `wss://officestonks-proxy-production.up.railway.app/ws?token=${token}`;

  // Log the URL to verify it's correct
  console.log('HARDCODED WebSocket URL:', wsUrl);
  
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
        jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control chars except whitespace
        jsonStr = jsonStr.trim(); // Remove leading/trailing whitespace
      }
      
      // Parse and process the message
      const message = JSON.parse(jsonStr);
      
      // Update stock price cache if it's a stock update
      if (message.type === 'stock_update' || (message.id && message.current_price)) {
        const stockId = message.stock_id || message.id;
        const price = message.price || message.current_price;
        
        if (stockId && price) {
          // Store the latest price in cache
          stockPriceCache[stockId] = price;
        }
      }
      
      // Call listeners for this message type
      if (listeners[message.type]) {
        listeners[message.type].forEach(callback => callback(message));
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
  socket.addEventListener('close', () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect
    reconnect();
  });
  
  // Connection error
  socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    
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