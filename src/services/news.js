import { api } from '../config/api';

/**
 * Fetches recent news articles
 * @param {number} limit - Maximum number of news items to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of news items
 */
export const getRecentNews = async (limit = 10, offset = 0) => {
  try {
    const response = await api.get(`/api/news?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent news:', error);
    throw error;
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
    const response = await api.get(`/api/news/stock/${stockId}?limit=${limit}&offset=${offset}`);
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
    const response = await api.get(`/api/news/sector/${sectorId}?limit=${limit}&offset=${offset}`);
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
    const response = await api.get(`/api/news/${newsId}`);
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
    const response = await api.get(`/api/events/market?limit=${limit}&offset=${offset}`);
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
      ? `/api/events/sector/${sectorId}?limit=${limit}&offset=${offset}`
      : `/api/events/sector?limit=${limit}&offset=${offset}`;
    
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
      ? `/api/events/company/${stockId}?limit=${limit}&offset=${offset}`
      : `/api/events/company?limit=${limit}&offset=${offset}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching company events:', error);
    throw error;
  }
};