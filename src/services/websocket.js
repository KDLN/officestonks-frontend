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

// Expose listeners for direct access by the market event generator
// This is a development-only feature to allow proper event propagation
if (typeof window !== 'undefined') {
  window.websocketListeners = listeners;
}

// Cache to store latest stock prices across page navigations
export const stockPriceCache = {};

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
  fetch(`${proxyUrl}/health`, {
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
        wsStatusIndicator.style.background = '#f44336';
        wsStatusIndicator.innerHTML = 'API Health: Failed';
        wsStatusIndicator.dataset.status = 'api-failed';
        document.dispatchEvent(new CustomEvent('websocket-error', { detail: { message: 'API health check failed' } }));
      } else {
        console.log('Backend health check passed');
        wsStatusIndicator.innerHTML = 'API Health: OK, Connecting WS...';
        return response.json();
      }
    })
    .then(data => {
      if (data) {
        console.log('Backend status:', data);
        document.dispatchEvent(new CustomEvent('api-health-ok', { detail: data }));
      }
    })
    .catch(error => {
      console.error('Backend health check error:', error);
      console.error('Backend API server may be unreachable - check server status');
      wsStatusIndicator.style.background = '#f44336';
      wsStatusIndicator.innerHTML = 'API Unreachable';
      wsStatusIndicator.dataset.status = 'api-unreachable';
      document.dispatchEvent(new CustomEvent('websocket-error', { detail: { message: 'API unreachable', error } }));
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
    getLatestPrice
  };
};