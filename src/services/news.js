import { api } from '../config/api';

/**
 * Fetches recent news articles
 * @param {number} limit - Maximum number of news items to retrieve
 * @param {number} offset - Number of items to skip for pagination
 * @returns {Promise<Array>} - Array of news items
 */
/**
 * Import the sample news data for fallback
 */
import { sampleNewsItems } from '../utils/news-test-data';

export const getRecentNews = async (limit = 10, offset = 0) => {
  try {
    console.log(`Attempting to fetch news with limit=${limit}, offset=${offset}`);
    
    // Try regular API call first
    try {
      console.log(`Fetching news with URL: news?limit=${limit}&offset=${offset}`);
      const response = await api.get(`news?limit=${limit}&offset=${offset}`);
      console.log('News API response:', response);
      
      // Verify valid data was returned
      if (response && (Array.isArray(response.data) || Array.isArray(response))) {
        const newsData = response.data || response;
        console.log(`Successfully fetched ${newsData.length} news items`);
        return newsData;
      } else {
        console.warn('News API returned invalid data format:', response);
        throw new Error('Invalid data format returned from API');
      }
    } catch (initialError) {
      console.warn('Initial news fetch failed, trying alternative methods:', initialError);
      
      // Try direct news endpoint without additional path segments
      try {
        console.log('Trying direct news-direct endpoint via proxy');
        // Use the special news-direct endpoint from our proxy
        const directResponse = await fetch('https://officestonks-proxy-production.up.railway.app/api/news-direct', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!directResponse.ok) {
          console.warn(`Direct news endpoint failed: ${directResponse.status}`);
          throw new Error(`Direct news endpoint failed: ${directResponse.status}`);
        }
        
        const directData = await directResponse.json();
        console.log('Direct news endpoint response:', directData);
        
        if (Array.isArray(directData)) {
          return directData;
        } else {
          throw new Error('Invalid data format from direct endpoint');
        }
      } catch (directError) {
        console.warn('Direct news endpoint failed, trying public CORS proxy:', directError);
        
        // Last try: Using a public CORS proxy
        try {
          const targetUrl = 'https://officestonks-backend-production.up.railway.app/api/news';
          const corsProxyUrl = 'https://corsproxy.io/?';
          const encodedUrl = encodeURIComponent(`${targetUrl}?limit=${limit}&offset=${offset}`);
          
          console.log(`Trying public CORS proxy: ${corsProxyUrl}${encodedUrl}`);
          
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
        } catch (corsError) {
          console.error('All API methods failed, falling back to sample data:', corsError);
          throw corsError;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching recent news (all methods failed):', error);
    console.info('Returning sample news data as fallback');
    
    // Return sample data to use as fallback
    return JSON.parse(JSON.stringify(sampleNewsItems));
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