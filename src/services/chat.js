/**
 * Chat service for frontend
 * Handles chat messaging functionality
 */

import { fetchWithAuth } from '../utils/http';
import { ENDPOINTS } from '../config/api';

/**
 * Get recent chat messages
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} List of chat messages
 */
export const getRecentMessages = async (limit = 50) => {
  try {
    return await fetchWithAuth(`${ENDPOINTS.CHAT_MESSAGES}?limit=${limit}`);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

/**
 * Send a chat message
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} Send result
 */
export const sendChatMessage = async (message) => {
  try {
    return await fetchWithAuth(ENDPOINTS.CHAT_SEND, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};