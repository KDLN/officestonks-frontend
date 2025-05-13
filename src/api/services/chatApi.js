/**
 * Chat API Service
 * Handles chat messaging functionality
 */

import { defaultClient } from '../index';
import { getConfig } from '../config';

const ENDPOINTS = getConfig().ENDPOINTS.CHAT;

/**
 * Get recent chat messages
 * @param {number} limit - Maximum number of messages to retrieve
 * @returns {Promise<Array>} List of chat messages
 */
export const getRecentMessages = async (limit = 50) => {
  try {
    return await defaultClient.get(`${ENDPOINTS.MESSAGES}?limit=${limit}`);
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
    return await defaultClient.post(ENDPOINTS.SEND, { message });
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};