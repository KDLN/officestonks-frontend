/**
 * Stock market service for frontend
 * Handles stock data, trading, portfolio and transaction functionality
 */

import { fetchWithAuth } from '../utils/http';
import { ENDPOINTS } from '../config/api';
import { fetchViaProxy } from './public-proxy';

/**
 * Get all available stocks
 * @returns {Promise<Array>} List of all stocks
 */
export const getAllStocks = async () => {
  try {
    try {
      // First try: Regular API
      return await fetchWithAuth(ENDPOINTS.STOCKS);
    } catch (initialError) {
      console.warn('Regular stocks fetch failed, trying public proxy:', initialError);
      
      // Second try: Using public CORS proxy
      return await fetchViaProxy('stocks');
    }
  } catch (error) {
    console.error('Error fetching stocks (all methods failed):', error);
    
    // Return empty array instead of throwing
    return [];
  }
};

/**
 * Get a specific stock by ID
 * @param {number} stockId - ID of the stock to fetch
 * @returns {Promise<Object>} Stock details
 */
export const getStockById = async (stockId) => {
  try {
    return await fetchWithAuth(ENDPOINTS.STOCK_DETAIL(stockId));
  } catch (error) {
    console.error(`Error fetching stock ${stockId}:`, error);
    throw error;
  }
};

/**
 * Get the user's portfolio
 * @returns {Promise<Object>} User's portfolio
 */
export const getUserPortfolio = async () => {
  try {
    try {
      // First try: Regular API
      return await fetchWithAuth(ENDPOINTS.PORTFOLIO);
    } catch (initialError) {
      console.warn('Regular portfolio fetch failed, trying public proxy:', initialError);
      
      // Second try: Using public CORS proxy
      return await fetchViaProxy('portfolio');
    }
  } catch (error) {
    console.error('Error fetching portfolio (all methods failed):', error);
    
    // Return empty portfolio structure instead of throwing
    return {
      portfolio_items: [],
      cash_balance: 10000, // Default starting cash
      stock_value: 0,
      total_value: 10000
    };
  }
};

/**
 * Execute a trade (buy or sell)
 * @param {number} stockId - ID of the stock to trade
 * @param {number} quantity - Number of shares to trade
 * @param {string} action - 'buy' or 'sell'
 * @returns {Promise<Object>} Trade result
 */
export const executeTrade = async (stockId, quantity, action) => {
  try {
    return await fetchWithAuth(ENDPOINTS.TRADING, {
      method: 'POST',
      body: JSON.stringify({
        stock_id: stockId,
        quantity: quantity,
        action: action, // 'buy' or 'sell'
      }),
    });
  } catch (error) {
    console.error(`Error executing ${action} trade:`, error);
    throw error;
  }
};

/**
 * Get transaction history
 * @param {number} limit - Max number of transactions to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} List of transactions
 */
export const getTransactionHistory = async (limit = 50, offset = 0) => {
  try {
    try {
      // First try: Regular API
      return await fetchWithAuth(`${ENDPOINTS.TRANSACTIONS}?limit=${limit}&offset=${offset}`);
    } catch (initialError) {
      console.warn('Regular transactions fetch failed, trying public proxy:', initialError);
      
      // Second try: Using public CORS proxy
      return await fetchViaProxy(`transactions?limit=${limit}&offset=${offset}`);
    }
  } catch (error) {
    console.error('Error fetching transaction history (all methods failed):', error);
    
    // Return empty array instead of throwing
    return [];
  }
};