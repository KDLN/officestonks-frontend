/**
 * WebSocket API Service
 * Provides WebSocket connection and message handling for the application
 */

import { getConfig } from '../config';

// WebSocket connection
let socket = null;

// Event listeners
let listeners = {};

// Reconnection settings
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

// Stock price cache
export const stockPriceCache = {};

/**
 * Initialize WebSocket connection
 * @param {string} token - Authentication token
 * @returns {WebSocket|null} WebSocket instance or null if no token
 */
export const initWebSocket = (token) => {
  // Close any existing connection
  if (socket) {
    socket.close();
  }

  // Can't connect without a token
  if (!token) {
    console.error('No authentication token available for WebSocket connection');
    return null;
  }

  // Generate WebSocket URL
  const config = getConfig();
  const wsUrl = `${config.WS_URL}?token=${token}`;
  
  console.log('Connecting to WebSocket:', wsUrl);
  
  // Create new WebSocket connection
  try {
    socket = new WebSocket(wsUrl);
    
    // Connection opened handler
    socket.addEventListener('open', () => {
      console.log('WebSocket connection established successfully');
      reconnectAttempts = 0;
      
      // Clear reconnect timer if exists
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    });
    
    // Message handler
    socket.addEventListener('message', (event) => {
      try {
        console.log('Received WebSocket message:', event.data);
        
        // Clean the message string if needed
        let jsonStr = event.data;
        if (typeof jsonStr === 'string') {
          // Remove any BOM and control characters
          jsonStr = jsonStr.replace(/^\ufeff/, ''); // Remove byte order mark
          jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control chars
          jsonStr = jsonStr.trim(); // Remove leading/trailing whitespace
        }
        
        // Parse the message
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
        
        // Notify type-specific listeners
        if (listeners[message.type]) {
          listeners[message.type].forEach(callback => callback(message));
        }
        
        // Notify global listeners
        if (listeners['*']) {
          listeners['*'].forEach(callback => callback(message));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        console.error('Message content:', event.data);
      }
    });
    
    // Connection closed handler
    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect
      reconnect(token);
    });
    
    // Error handler
    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      
      // Additional debugging information
      console.error('WebSocket connection failed - possible CORS issue or server unavailable');
      console.error('Current origin:', window.location.origin);
      console.error('WebSocket URL:', wsUrl);
      
      // Socket will automatically close after error
    });
    
    return socket;
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    return null;
  }
};

/**
 * Add event listener for WebSocket messages
 * @param {string} type - Message type or '*' for all messages
 * @param {Function} callback - Callback function
 * @returns {Function} Function to remove listener
 */
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

/**
 * Remove event listener
 * @param {string} type - Message type
 * @param {Function} callback - Callback function
 */
export const removeListener = (type, callback) => {
  if (listeners[type]) {
    listeners[type] = listeners[type].filter(cb => cb !== callback);
  }
};

/**
 * Close WebSocket connection
 */
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

/**
 * Reconnect to WebSocket
 * @param {string} token - Authentication token
 */
const reconnect = (token) => {
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
    initWebSocket(token);
  }, RECONNECT_DELAY);
};

/**
 * Get latest price from cache or use default
 * @param {number} stockId - Stock ID
 * @param {number} defaultPrice - Default price if not in cache
 * @returns {number} Current price
 */
export const getLatestPrice = (stockId, defaultPrice) => {
  return stockId in stockPriceCache ? stockPriceCache[stockId] : defaultPrice;
};

/**
 * Send message through WebSocket
 * @param {Object} message - Message to send
 * @returns {boolean} True if sent successfully
 */
export const sendMessage = (message) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket not connected');
    return false;
  }
  
  try {
    socket.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
};

/**
 * Check if WebSocket is connected
 * @returns {boolean} True if connected
 */
export const isConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};