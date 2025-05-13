import { api } from '../config/api';

/**
 * Fetches recent news articles
 * @param {number} limit - Maximum number of news items to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of news items
 */
export const getRecentNews = async (limit = 10, offset = 0) => {
  try {
    // Use the news endpoint through the API URL
    console.log(`Fetching news with URL: news?limit=${limit}&offset=${offset}`);
    
    try {
      // First try: Regular API call
      const response = await api.get(`news?limit=${limit}&offset=${offset}`);
      console.log('News API response:', response);
      return response.data || response;
    } catch (initialError) {
      console.warn('Initial news fetch failed, trying public CORS proxy:', initialError);
      
      // Second try: Using a public CORS proxy
      const targetUrl = 'https://officestonks-backend-production.up.railway.app/api/news';
      const corsProxyUrl = 'https://corsproxy.io/?';
      const encodedUrl = encodeURIComponent(`${targetUrl}?limit=${limit}&offset=${offset}`);
      
      console.log(`Trying CORS proxy: ${corsProxyUrl}${encodedUrl}`);
      
      const corsResponse = await fetch(`${corsProxyUrl}${encodedUrl}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!corsResponse.ok) {
        throw new Error(`CORS proxy failed: ${corsResponse.status} ${corsResponse.statusText}`);
      }
      
      const data = await corsResponse.json();
      console.log('CORS proxy response:', data);
      return data;
    }
  } catch (error) {
    console.error('Error fetching recent news (all methods failed):', error);
    console.error('Request failed, using sample data:', error.message);
    return []; // Return empty array to trigger fallback to sample data
  }
};

/**
 * Fetches news related to a specific stock
 * @param {number} stockId - ID of the stock
 * @param {number} limit - Maximum number of news items to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of news items related to the stock
 */
export const getStockNews = async (stockId, limit = 10, offset = 0) => {
  try {
    const response = await api.get(`news/stock/${stockId}?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching news for stock ${stockId}:`, error);
    throw error;
  }
};

/**
 * Fetches news related to a specific sector
 * @param {string} sectorId - ID of the sector
 * @param {number} limit - Maximum number of news items to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of news items related to the sector
 */
export const getSectorNews = async (sectorId, limit = 10, offset = 0) => {
  try {
    const response = await api.get(`news/sector/${sectorId}?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching news for sector ${sectorId}:`, error);
    throw error;
  }
};

/**
 * Fetches a specific news article by ID
 * @param {number} newsId - ID of the news article
 * @returns {Promise<Object>} - News item details
 */
export const getNewsById = async (newsId) => {
  try {
    const response = await api.get(`news/${newsId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching news item ${newsId}:`, error);
    throw error;
  }
};

/**
 * Fetches market events
 * @param {number} limit - Maximum number of events to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of market events
 */
export const getMarketEvents = async (limit = 10, offset = 0) => {
  try {
    const response = await api.get(`events/market?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching market events:', error);
    throw error;
  }
};

/**
 * Fetches sector events
 * @param {string} sectorId - ID of the sector (optional)
 * @param {number} limit - Maximum number of events to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of sector events
 */
export const getSectorEvents = async (sectorId = null, limit = 10, offset = 0) => {
  try {
    const url = sectorId 
      ? `events/sector/${sectorId}?limit=${limit}&offset=${offset}`
      : `events/sector?limit=${limit}&offset=${offset}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching sector events:', error);
    throw error;
  }
};

/**
 * Fetches company events
 * @param {number} stockId - ID of the stock (optional)
 * @param {number} limit - Maximum number of events to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of company events
 */
export const getCompanyEvents = async (stockId = null, limit = 10, offset = 0) => {
  try {
    const url = stockId 
      ? `events/company/${stockId}?limit=${limit}&offset=${offset}`
      : `events/company?limit=${limit}&offset=${offset}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching company events:', error);
    throw error;
  }
};