// User service for frontend
import { addAuthToRequest } from './auth';

// Make sure to include the correct API path
const BASE_URL = process.env.REACT_APP_API_URL || 'https://web-copy-production-5b48.up.railway.app';
const API_URL = `${BASE_URL}/api`;
console.log("User service using API URL:", API_URL);

// Get leaderboard data
export const getLeaderboard = async (limit = 10) => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/users/leaderboard?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch leaderboard');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

// Get current user's profile
export const getUserProfile = async () => {
  try {
    // Prepare request config with auth
    const { url, options } = addAuthToRequest(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Make the request
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};