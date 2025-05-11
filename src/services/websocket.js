/**
 * WebSocket service for real-time updates
 * Provides WebSocket connection and message handling for the application
 */
import { getToken } from './auth';
import { WS_URL, BACKEND_URL, API_URL, ENDPOINTS } from '../config/api';

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

  // Socket will be initialized below

  const token = getToken();
  if (!token) {
    console.error('No authentication token available for WebSocket connection');
    return;
  }

  // Create WebSocket connection with token
  // Use the centralized WebSocket URL from config/api.js

  // First check if the backend API is available
  fetch(`${API_URL}/${ENDPOINTS.API_HEALTH}`, {
    method: 'GET',
    credentials: 'include',
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
      if (data) console.log('Backend API status:', data);
    })
    .catch(error => {
      console.error('Backend health check error:', error);
      console.error('Backend API server may be unreachable - check server status');
    });

  // Also check WebSocket health endpoint with proper error handling
  fetch(`${BACKEND_URL}/${ENDPOINTS.WS_HEALTH}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    }
  })
    .then(response => {
      if (!response.ok) {
        console.error(`WebSocket health check failed: ${response.status} ${response.statusText}`);
      } else {
        console.log('WebSocket health check passed');
        return response.json();
      }
    })
    .then(data => {
      if (data) console.log('WebSocket health data:', data);
    })
    .catch(error => {
      console.error('WebSocket server health check failed:', error);
      console.error('WebSocket server may be unreachable');

      // Recommend alternative approach if health check fails
      console.log('Trying to establish WebSocket connection anyway...');
    });

  // Create the WebSocket URL with token for authentication
  const wsUrl = `${WS_URL}?token=${token}`;

  console.log('Connecting to WebSocket:', wsUrl);

  // Add custom headers in the constructor for WebSocket
  // Note: Browsers often don't allow custom headers in WebSocket connections
  // so we append the token as a query parameter
  socket = new WebSocket(wsUrl);

  // Make socket and addListener available globally for other components
  window.socket = socket;
  window.addListener = addListener;

  // Connection opened
  socket.addEventListener('open', () => {
    console.log('WebSocket connection established');
    // Reset reconnect attempts on successful connection
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  // Listen for messages
  socket.addEventListener('message', (event) => {
    try {
      // Log raw message for debugging
      console.log('Raw WebSocket message:', event.data);

      // Clean the message string
      let jsonStr = event.data;
      if (typeof jsonStr === 'string') {
        // Remove any BOM and control characters
        jsonStr = jsonStr.replace(/^\ufeff/, ''); // Remove byte order mark
        jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control chars except whitespace
        jsonStr = jsonStr.trim(); // Remove leading/trailing whitespace

        // Backend should now send each message separately, but keep handling for robustness
        if (jsonStr.includes('}{')) {
          console.log('Found multiple JSON objects in message - splitting');

          // Split by finding object boundaries - this handles nested objects better
          let objects = [];
          let nesting = 0;
          let start = 0;

          for (let i = 0; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') {
              if (nesting === 0) start = i;
              nesting++;
            } else if (jsonStr[i] === '}') {
              nesting--;
              if (nesting === 0) {
                // Extract complete object
                objects.push(jsonStr.substring(start, i + 1));
              }
            }
          }

          console.log(`Split into ${objects.length} JSON objects`);

          // Process each message individually
          objects.forEach(jsonObj => {
            try {
              const parsedObj = JSON.parse(jsonObj);
              processMessage(parsedObj);
            } catch (innerErr) {
              console.error('Error parsing individual JSON object:', innerErr);
              console.error('Object content:', jsonObj);
            }
          });

          return; // We've handled the multiple objects
        }
      }

      // Process a single JSON message
      try {
        const message = JSON.parse(jsonStr);
        processMessage(message);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
    } catch (e) {
      console.error('Error processing WebSocket message:', e);
      console.error('Message content:', event.data);

      // Final fallback attempt for malformed messages
      try {
        // Sometimes we might receive messages with extra characters or incorrect format
        // Try to extract valid JSON objects using a regex
        const messageStr = String(event.data);
        const regex = /({[^}]+})/g;
        const matches = messageStr.match(regex);

        if (matches && matches.length > 0) {
          console.log('Fallback: Found potential JSON objects:', matches.length);
          matches.forEach(match => {
            try {
              // Try to clean and parse each match
              const cleanMatch = match.replace(/[^\x20-\x7E]/g, '');
              const parsedMsg = JSON.parse(cleanMatch);
              console.log('Successfully parsed from fallback:', parsedMsg);
              processMessage(parsedMsg);
            } catch (matchErr) {
              // Just log and continue
              console.log('Failed to parse potential object:', match);
            }
          });
        }
      } catch (fallbackErr) {
        console.error('All parsing attempts failed');
      }
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

    // Add more detailed error logging to help debug CORS issues
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

// Helper function to process a single parsed message
function processMessage(message) {
  // Update stock price cache if it's a stock update
  if (message.type === 'stock_update' || (message.id && message.current_price)) {
    const stockId = message.stock_id || message.id;
    const price = message.price || message.current_price;

    if (stockId && price) {
      // Store the latest price in cache
      stockPriceCache[stockId] = price;
    }
  }

  // Call all listeners for this message type
  if (listeners[message.type]) {
    listeners[message.type].forEach(callback => callback(message));
  }

  // Call general listeners
  if (listeners['*']) {
    listeners['*'].forEach(callback => callback(message));
  }
}

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