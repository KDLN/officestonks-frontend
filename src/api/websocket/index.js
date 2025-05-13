/**
 * @fileoverview WebSocket API module
 * 
 * This file exports the WebSocket API for use in the application.
 */

// Export client
export { default as webSocketClient } from './client';
export { stockPriceCache } from './client';

// Export config utilities
export { getConfig, getWebSocketUrl, log } from './config';

// Export message types and utilities
export { 
  MESSAGE_TYPES,
  createMessage,
  createStockUpdateMessage,
  createChatMessage,
  createErrorMessage,
  parseMessage
} from './types';

// Export hooks
export {
  useWebSocket,
  useWebSocketMessage,
  useStockUpdates,
  useChatMessages
} from './hooks';

// Initialize WebSocket with token
export const initializeWebSocket = (token) => {
  return webSocketClient.connect(token);
};

// Close WebSocket connection
export const closeWebSocket = () => {
  return webSocketClient.close();
};

// Send WebSocket message
export const sendMessage = (message) => {
  return webSocketClient.send(message);
};

// Check if WebSocket is connected
export const isConnected = () => {
  return webSocketClient.isConnected();
};

// Get latest stock price
export const getLatestPrice = (stockId, defaultPrice) => {
  return webSocketClient.getLatestPrice(stockId, defaultPrice);
};