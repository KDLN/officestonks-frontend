/**
 * @fileoverview React hooks for WebSocket integration
 * 
 * This file provides React hooks for using WebSocket in components.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MESSAGE_TYPES } from './types';
import webSocketClient from './client';
import { log } from './config';

/**
 * Hook for using WebSocket in components
 * @param {string} token - Authentication token
 * @param {Object} options - Hook options
 * @param {boolean} options.autoConnect - Connect automatically on mount
 * @param {boolean} options.reconnect - Reconnect on token change
 * @returns {Object} WebSocket utilities
 */
export const useWebSocket = (token, options = {}) => {
  const { autoConnect = true, reconnect = true } = options;
  
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  
  // Store token in ref to avoid unnecessary reconnects
  const tokenRef = useRef(token);
  const connectedRef = useRef(connected);
  
  // Update refs when state changes
  useEffect(() => {
    tokenRef.current = token;
    connectedRef.current = connected;
  }, [token, connected]);
  
  // Connect to WebSocket
  const connect = useCallback(async () => {
    // Skip if no token
    if (!tokenRef.current) {
      setError(new Error('No authentication token'));
      return;
    }
    
    // Skip if already connected
    if (connectedRef.current) {
      return;
    }
    
    try {
      setConnecting(true);
      setError(null);
      
      await webSocketClient.connect(tokenRef.current);
      
      setConnected(true);
      setConnecting(false);
    } catch (error) {
      log('error', 'Error connecting to WebSocket', error);
      setConnected(false);
      setConnecting(false);
      setError(error);
    }
  }, []);
  
  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    webSocketClient.close();
    setConnected(false);
  }, []);
  
  // Send message to WebSocket
  const send = useCallback((message) => {
    return webSocketClient.send(message);
  }, []);
  
  // Connect on mount
  useEffect(() => {
    // Skip if no token or auto-connect disabled
    if (!autoConnect || !token) {
      return;
    }
    
    connect();
    
    return () => {
      // Don't disconnect on unmount - this would break the app when navigating between pages
      // Disconnect is only called explicitly or when the token changes
    };
  }, [autoConnect, token, connect]);
  
  // Reconnect on token change
  useEffect(() => {
    if (!reconnect) {
      return;
    }
    
    // Only reconnect if already connected or had a previous token
    if (webSocketClient.isConnected() || webSocketClient.token) {
      disconnect();
      
      // Wait a bit before reconnecting to allow the old connection to fully close
      setTimeout(connect, 500);
    }
  }, [token, reconnect, connect, disconnect]);
  
  // Listen for connection state changes
  useEffect(() => {
    const onConnected = () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    };
    
    const onDisconnected = () => {
      setConnected(false);
    };
    
    const onError = (error) => {
      setError(error);
    };
    
    // Add listeners
    const removeConnectedListener = webSocketClient.addListener(MESSAGE_TYPES.CONNECTED, onConnected);
    const removeDisconnectedListener = webSocketClient.addListener(MESSAGE_TYPES.DISCONNECTED, onDisconnected);
    const removeErrorListener = webSocketClient.addListener(MESSAGE_TYPES.ERROR, onError);
    
    return () => {
      // Remove listeners
      removeConnectedListener();
      removeDisconnectedListener();
      removeErrorListener();
    };
  }, []);
  
  return {
    connected,
    connecting,
    error,
    connect,
    disconnect,
    send,
    client: webSocketClient
  };
};

/**
 * Hook for subscribing to WebSocket messages
 * @param {string} messageType - Message type to subscribe to, or '*' for all
 * @param {Function} callback - Callback function
 */
export const useWebSocketMessage = (messageType, callback) => {
  // Use ref for callback to avoid unnecessary re-subscriptions
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  // Subscribe to messages
  useEffect(() => {
    // Skip if no message type
    if (!messageType) {
      return;
    }
    
    // Create wrapped callback that calls current ref
    const wrappedCallback = (message) => {
      if (callbackRef.current) {
        callbackRef.current(message);
      }
    };
    
    // Add listener
    const removeListener = webSocketClient.addListener(messageType, wrappedCallback);
    
    // Remove listener on unmount
    return () => {
      removeListener();
    };
  }, [messageType]);
};

/**
 * Hook for subscribing to stock price updates
 * @param {number} stockId - Stock ID to subscribe to, or null for all stocks
 * @param {Function} callback - Callback function
 */
export const useStockUpdates = (stockId, callback) => {
  useWebSocketMessage(MESSAGE_TYPES.STOCK_UPDATE, useCallback((message) => {
    // Call callback for all stocks or specific stock
    if (!stockId || message.stock_id === stockId) {
      callback(message);
    }
  }, [stockId, callback]));
  
  // Get current price from cache
  const getCurrentPrice = useCallback((defaultPrice) => {
    return stockId ? webSocketClient.getLatestPrice(stockId, defaultPrice) : null;
  }, [stockId]);
  
  return { getCurrentPrice };
};

/**
 * Hook for subscribing to chat messages
 * @param {Function} callback - Callback function
 */
export const useChatMessages = (callback) => {
  useWebSocketMessage(MESSAGE_TYPES.CHAT_MESSAGE, callback);
  
  // Send chat message
  const sendMessage = useCallback((message) => {
    return webSocketClient.send({
      type: MESSAGE_TYPES.CHAT_MESSAGE,
      message,
      timestamp: new Date().toISOString()
    });
  }, []);
  
  return { sendMessage };
};