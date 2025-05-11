/**
 * User service for frontend
 * Handles user profile and leaderboard functionality
 */

import { fetchWithAuth } from '../utils/http';
import { ENDPOINTS } from '../config/api';

/**
 * Get leaderboard data
 * @param {number} limit - Maximum number of users to return
 * @returns {Promise<Array>} List of top users
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    return await fetchWithAuth(`${ENDPOINTS.LEADERBOARD}?limit=${limit}`);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Get current user's profile
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    return await fetchWithAuth(ENDPOINTS.USER_PROFILE);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};