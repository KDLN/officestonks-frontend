/**
 * @fileoverview WebSocket message type definitions
 * 
 * This file defines the message types used in WebSocket communication
 * and provides type constants and helper functions.
 */

/**
 * WebSocket message types
 */
export const MESSAGE_TYPES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  STOCK_UPDATE: 'stock_update',
  CHAT_MESSAGE: 'chat_message',
  PING: 'ping',
  PONG: 'pong'
};

/**
 * Creates a base message structure
 * @param {string} type - Message type
 * @param {*} data - Message data
 * @returns {Object} Base message object
 */
export const createMessage = (type, data = null) => {
  return {
    type,
    ...(data && { data })
  };
};

/**
 * Creates a stock update message
 * @param {number} stockId - Stock ID
 * @param {string} symbol - Stock symbol
 * @param {number} price - Current stock price
 * @returns {Object} Stock update message
 */
export const createStockUpdateMessage = (stockId, symbol, price) => {
  return {
    type: MESSAGE_TYPES.STOCK_UPDATE,
    stock_id: stockId,
    symbol,
    price
  };
};

/**
 * Creates a chat message
 * @param {number} userId - User ID
 * @param {string} username - Username
 * @param {string} message - Chat message text
 * @returns {Object} Chat message
 */
export const createChatMessage = (userId, username, message) => {
  return {
    type: MESSAGE_TYPES.CHAT_MESSAGE,
    user_id: userId,
    username,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates an error message
 * @param {string} error - Error message
 * @param {number} code - Error code
 * @returns {Object} Error message
 */
export const createErrorMessage = (error, code = 500) => {
  return {
    type: MESSAGE_TYPES.ERROR,
    error,
    code
  };
};

/**
 * Parses a WebSocket message
 * @param {string} data - Raw message data
 * @returns {Object} Parsed message
 * @throws {Error} If message cannot be parsed
 */
export const parseMessage = (data) => {
  try {
    // Clean the message string if needed
    let jsonStr = data;
    if (typeof jsonStr === 'string') {
      // Remove any BOM and control characters
      jsonStr = jsonStr.replace(/^\ufeff/, ''); // Remove byte order mark
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // Remove control chars
      jsonStr = jsonStr.trim(); // Remove leading/trailing whitespace
    }
    
    // Parse the message
    return JSON.parse(jsonStr);
  } catch (error) {
    throw new Error(`Failed to parse WebSocket message: ${error.message}`);
  }
};