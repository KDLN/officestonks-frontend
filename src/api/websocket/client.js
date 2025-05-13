/**
 * @fileoverview WebSocket client implementation
 * 
 * This file provides a WebSocket client with reconnection, 
 * message handling, and error reporting.
 */

import { getConfig, getWebSocketUrl, log } from './config';
import { MESSAGE_TYPES, parseMessage } from './types';

// Stock price cache
export const stockPriceCache = {};

// WebSocket client class
class WebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.connected = false;
    this.connecting = false;
    this.token = null;
    this.config = getConfig();
    this.healthCheckTimer = null;
  }

  /**
   * Initialize WebSocket connection
   * @param {string} token - Authentication token
   * @returns {Promise<WebSocket>} WebSocket connection
   */
  async connect(token) {
    // Save token for reconnection
    this.token = token;
    
    // Check if already connected or connecting
    if (this.connected) {
      return this.socket;
    }
    
    if (this.connecting) {
      // Wait for connection to complete
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (this.connected) {
            clearInterval(checkInterval);
            resolve(this.socket);
          } else if (!this.connecting) {
            clearInterval(checkInterval);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }
    
    // Mark as connecting
    this.connecting = true;
    
    // Close any existing connection
    this.close();
    
    // Can't connect without a token
    if (!token) {
      this.connecting = false;
      throw new Error('No authentication token available for WebSocket connection');
    }
    
    // Generate WebSocket URL
    const wsUrl = getWebSocketUrl(token);
    log('info', 'Connecting to WebSocket', wsUrl);
    
    try {
      // Create new WebSocket connection with connection timeout
      const socket = new WebSocket(wsUrl);
      this.socket = socket;
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!this.connected) {
          log('error', 'WebSocket connection timeout');
          socket.close();
        }
      }, this.config.CONNECTION_TIMEOUT_MS);
      
      // Set up event handlers
      return await new Promise((resolve, reject) => {
        // Connection opened handler
        socket.addEventListener('open', () => {
          clearTimeout(connectionTimeout);
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          
          log('info', 'WebSocket connection established successfully');
          
          // Start health check
          this.startHealthCheck();
          
          resolve(socket);
        });
        
        // Message handler
        socket.addEventListener('message', this.handleMessage.bind(this));
        
        // Connection closed handler
        socket.addEventListener('close', () => {
          clearTimeout(connectionTimeout);
          this.onClose();
          
          if (this.connecting) {
            this.connecting = false;
            reject(new Error('WebSocket connection closed during connection attempt'));
          }
        });
        
        // Error handler
        socket.addEventListener('error', (error) => {
          clearTimeout(connectionTimeout);
          
          log('error', 'WebSocket error', error);
          
          // Add detailed error information
          log('error', 'WebSocket connection failed - possible CORS issue or server unavailable', {
            origin: window.location.origin,
            url: wsUrl
          });
          
          if (this.connecting) {
            this.connecting = false;
            reject(error);
          }
        });
      });
    } catch (error) {
      this.connecting = false;
      throw error;
    }
  }
  
  /**
   * Close WebSocket connection
   */
  close() {
    // Stop health check
    this.stopHealthCheck();
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Close connection
    if (this.socket) {
      // Remove event listeners
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onopen = null;
      
      // Close socket
      try {
        this.socket.close();
      } catch (error) {
        // Ignore errors when closing
      }
      
      this.socket = null;
    }
    
    this.connected = false;
  }
  
  /**
   * Handle WebSocket message
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    try {
      log('debug', 'Received WebSocket message', event.data);
      
      // Parse the message
      const message = parseMessage(event.data);
      
      // Update stock price cache if it's a stock update
      if (message.type === MESSAGE_TYPES.STOCK_UPDATE || (message.id && message.current_price)) {
        const stockId = message.stock_id || message.id;
        const price = message.price || message.current_price;
        
        if (stockId && price) {
          // Store the latest price in cache
          stockPriceCache[stockId] = price;
        }
      }
      
      // Call listeners for this message type
      this.notifyListeners(message.type, message);
      
      // Call general listeners
      this.notifyListeners('*', message);
    } catch (error) {
      log('error', 'Error processing WebSocket message', {
        error,
        data: event.data
      });
    }
  }
  
  /**
   * Handle WebSocket connection closed
   */
  onClose() {
    log('info', 'WebSocket connection closed');
    
    // Update state
    this.connected = false;
    this.connecting = false;
    
    // Stop health check
    this.stopHealthCheck();
    
    // Notify disconnected listeners
    this.notifyListeners(MESSAGE_TYPES.DISCONNECTED, {
      type: MESSAGE_TYPES.DISCONNECTED,
      timestamp: new Date().toISOString()
    });
    
    // Attempt to reconnect
    this.reconnect();
  }
  
  /**
   * Reconnect to WebSocket
   */
  reconnect() {
    // Don't reconnect if already reconnecting
    if (this.reconnectTimer) {
      return;
    }
    
    // Don't reconnect if no token
    if (!this.token) {
      log('warn', 'Cannot reconnect: No authentication token');
      return;
    }
    
    // Don't reconnect if too many attempts
    if (this.reconnectAttempts >= this.config.MAX_RECONNECT_ATTEMPTS) {
      log('error', `Failed to reconnect after ${this.reconnectAttempts} attempts`);
      
      // Notify listeners of permanent disconnection
      this.notifyListeners('reconnect_failed', {
        type: 'reconnect_failed',
        attempts: this.reconnectAttempts
      });
      
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calculate backoff delay
    let delay = this.config.RECONNECT_DELAY_MS * 
                Math.pow(this.config.RECONNECT_BACKOFF_FACTOR, this.reconnectAttempts - 1);
    
    // Cap delay
    delay = Math.min(delay, this.config.MAX_RECONNECT_DELAY_MS);
    
    log('info', `Reconnecting (attempt ${this.reconnectAttempts}/${this.config.MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
    
    // Schedule reconnect
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      
      // Notify listeners of reconnect attempt
      this.notifyListeners('reconnecting', {
        type: 'reconnecting',
        attempt: this.reconnectAttempts
      });
      
      // Attempt reconnection
      this.connect(this.token).catch((error) => {
        log('error', 'Reconnection failed', error);
      });
    }, delay);
  }
  
  /**
   * Start health check timer
   */
  startHealthCheck() {
    // Stop existing timer
    this.stopHealthCheck();
    
    // Start new timer
    this.healthCheckTimer = setInterval(() => {
      // Check if still connected
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send ping message
        this.send({
          type: MESSAGE_TYPES.PING,
          timestamp: new Date().toISOString()
        });
      } else {
        // Connection lost, stop health check
        this.stopHealthCheck();
      }
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Stop health check timer
   */
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
  
  /**
   * Add event listener
   * @param {string} type - Message type or '*' for all messages
   * @param {Function} callback - Callback function
   * @returns {Function} Function to remove listener
   */
  addListener(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    
    this.listeners[type].push(callback);
    
    // Return function to remove listener
    return () => this.removeListener(type, callback);
  }
  
  /**
   * Remove event listener
   * @param {string} type - Message type
   * @param {Function} callback - Callback function
   */
  removeListener(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
      
      // Clean up empty listener arrays
      if (this.listeners[type].length === 0) {
        delete this.listeners[type];
      }
    }
  }
  
  /**
   * Notify listeners of event
   * @param {string} type - Message type
   * @param {Object} message - Message data
   */
  notifyListeners(type, message) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          log('error', `Error in listener for ${type}`, error);
        }
      });
    }
  }
  
  /**
   * Send message through WebSocket
   * @param {Object} message - Message to send
   * @returns {boolean} True if sent successfully
   */
  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      log('error', 'Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      this.socket.send(data);
      return true;
    } catch (error) {
      log('error', 'Error sending WebSocket message', error);
      return false;
    }
  }
  
  /**
   * Check if WebSocket is connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected && this.socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get latest price from cache or use default
   * @param {number} stockId - Stock ID
   * @param {number} defaultPrice - Default price if not in cache
   * @returns {number} Current price
   */
  getLatestPrice(stockId, defaultPrice) {
    return stockId in stockPriceCache ? stockPriceCache[stockId] : defaultPrice;
  }
}

// Create a singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;