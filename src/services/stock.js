/**
 * Stock market service for frontend
 * Handles stock data, trading, portfolio and transaction functionality
 */

import { fetchWithAuth } from '../utils/http';
import { ENDPOINTS } from '../config/api';
import { fetchViaProxy } from './public-proxy';
import { stockPriceCache, marketEventGenerationPaused } from './websocket';

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

/**
 * Update all stocks based on a market event
 * @param {string} eventType - Type of event (market_event, sector_event, company_event)
 * @param {object} eventData - Event data containing the impact and impact_options
 * @param {Array} allStocks - Optional array of all stocks, will be fetched if not provided
 * @returns {Promise<Array>} Array of updated stock IDs and their new prices
 */
export const updateStocksFromEvent = async (eventType, eventData, allStocks = null) => {
  try {
    // Check if market event generation is paused
    if (marketEventGenerationPaused) {
      console.log('Market event generation is paused - skipping stock price updates');
      return [];
    }
    
    // Get all stocks if not provided
    const stocks = allStocks || await getAllStocks();
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      console.error('No stocks available to update');
      return [];
    }

    // Get the actual impact from impact_options
    let actualImpact = eventData.price_impact || 0;
    if (eventData.impact_options && Array.isArray(eventData.impact_options)) {
      const actualOption = eventData.impact_options.find(option => option.is_actual);
      if (actualOption) {
        actualImpact = actualOption.value;
        console.log(`Using actual impact option: ${actualImpact} (${actualOption.formatted})`);
      }
    }

    // No impact, no changes
    if (!actualImpact) {
      console.log('No impact value found in event data, skipping stock updates');
      return [];
    }

    // Track updated stocks
    const updatedStocks = [];
    let stocksNeedUpdate = false;

    // Apply the impact based on event type
    if (eventType === 'market_event') {
      // Market events affect all stocks
      console.log(`Applying market-wide impact of ${actualImpact} to all ${stocks.length} stocks`);
      
      stocks.forEach(stock => {
        if (!stock || !stock.id) return;
        
        // Apply the impact with some variance per stock (±30%)
        const variance = 0.7 + Math.random() * 0.6; // 70% to 130% of the impact
        const adjustedImpact = actualImpact * variance;
        const currentPrice = stock.current_price || 100; // Fallback to 100 if no price
        
        // CRITICAL FIX: Market events were calculating the price change incorrectly!
        // Check if the impact is a percentage or absolute change
        let priceChange;
        let newPrice;
        
        // IMPROVED PRICE CALCULATION LOGIC:
        // 1. Limit negative percentage changes to prevent catastrophic drops
        // 2. Use a higher minimum price floor
        
        // If impact is very small (like 0.01 to 0.05), it's probably a percentage
        if (Math.abs(adjustedImpact) < 0.1) {
          // It's a percentage, but we need to limit negative percentages
          
          // For negative impacts, don't allow more than 5% drop in a single event
          if (adjustedImpact < 0) {
            adjustedImpact = Math.max(adjustedImpact, -0.05);
            console.log(`⚠️ Limited negative percentage impact to -5%: ${adjustedImpact}`);
          }
          
          // Apply the percentage change
          newPrice = currentPrice * (1 + adjustedImpact);
        } else {
          // It's an absolute change - limit negative changes relative to stock price
          if (adjustedImpact < 0) {
            // Don't allow absolute drops greater than 5% of current price
            const maxAbsoluteDrop = currentPrice * 0.05;
            if (Math.abs(adjustedImpact) > maxAbsoluteDrop) {
              adjustedImpact = -maxAbsoluteDrop;
              console.log(`⚠️ Limited negative absolute impact to -$${maxAbsoluteDrop.toFixed(2)}`);
            }
          }
          
          priceChange = adjustedImpact; // Direct dollar amount
          newPrice = currentPrice + priceChange;
        }
        
        // Enhanced price floor - use a higher minimum of $5.00 (was $1.00)
        // Plus a stock-specific floor based on typical price range
        let stockFloor = 5.00; // Default absolute minimum of $5.00 for all stocks
        
        try {
          // Lookup the stock's symbol to determine typical price range
          const symbol = stock.symbol;
          if (symbol) {
            // Set a stock-specific floor based on typical price
            const defaultPrice = 
              symbol === 'AAPL' ? 175.34 :
              symbol === 'MSFT' ? 320.45 :
              symbol === 'AMZN' ? 128.95 :
              symbol === 'GOOGL' ? 145.60 :
              symbol === 'FB' ? 302.75 :
              symbol === 'TSLA' ? 245.30 :
              symbol === 'NFLX' ? 552.80 :
              symbol === 'NVDA' ? 468.25 :
              symbol === 'DIS' ? 105.45 :
              symbol === 'JPM' ? 175.15 :
              100.00; // Default for custom stocks
            
            // Floor is 25% of default price or $5.00, whichever is higher
            stockFloor = Math.max(5.00, defaultPrice * 0.25);
          }
        } catch (e) {
          console.error('Error determining stock floor price in market event:', e);
        }
        
        // Apply the floor to ensure price doesn't drop too low
        if (newPrice < stockFloor) {
          console.log(`📈 Floor protection: ${stock.symbol || 'Stock'} price ${newPrice.toFixed(2)} below floor ${stockFloor.toFixed(2)}`);
          newPrice = stockFloor;
        }
        
        // Update the price cache directly
        stockPriceCache[stock.id] = newPrice;
        
        // Flag the stock for local storage update
        stock.current_price = newPrice;
        stocksNeedUpdate = true;
        
        updatedStocks.push({
          id: stock.id,
          symbol: stock.symbol,
          previous_price: currentPrice,
          new_price: newPrice,
          change_percentage: adjustedImpact * 100
        });
      });
    } 
    else if (eventType === 'sector_event' && eventData.related_sectors) {
      // Sector events only affect stocks in specific sectors
      // This would require sectors to be defined in the stock data
      // For now, we'll randomly choose ~15% of stocks as affected
      const affectedCount = Math.max(1, Math.floor(stocks.length * 0.15));
      console.log(`Applying sector impact of ${actualImpact} to ${affectedCount} random stocks`);
      
      // Shuffle the stocks and pick the first 'affectedCount' stocks
      const shuffledStocks = [...stocks].sort(() => Math.random() - 0.5);
      const affectedStocks = shuffledStocks.slice(0, affectedCount);
      
      affectedStocks.forEach(stock => {
        if (!stock || !stock.id) return;
        
        // Apply the impact with some variance per stock (±20%)
        const variance = 0.8 + Math.random() * 0.4; // 80% to 120% of the impact
        const adjustedImpact = actualImpact * variance;
        const currentPrice = stock.current_price || 100; // Fallback to 100 if no price
        
        // CRITICAL FIX: Same fix as market events for sector events
        let priceChange;
        let newPrice;
        
        // IMPROVED PRICE CALCULATION LOGIC:
        // 1. Limit negative percentage changes to prevent catastrophic drops
        // 2. Use a higher minimum price floor
        
        // If impact is very small (like 0.01 to 0.05), it's probably a percentage
        if (Math.abs(adjustedImpact) < 0.1) {
          // It's a percentage, but we need to limit negative percentages
          
          // For negative impacts, don't allow more than 5% drop in a single event
          if (adjustedImpact < 0) {
            adjustedImpact = Math.max(adjustedImpact, -0.05);
            console.log(`⚠️ Limited negative percentage impact to -5% (sector event): ${adjustedImpact}`);
          }
          
          // Apply the percentage change
          newPrice = currentPrice * (1 + adjustedImpact);
        } else {
          // It's an absolute change - limit negative changes relative to stock price
          if (adjustedImpact < 0) {
            // Don't allow absolute drops greater than 5% of current price
            const maxAbsoluteDrop = currentPrice * 0.05;
            if (Math.abs(adjustedImpact) > maxAbsoluteDrop) {
              adjustedImpact = -maxAbsoluteDrop;
              console.log(`⚠️ Limited negative absolute impact to -$${maxAbsoluteDrop.toFixed(2)} (sector event)`);
            }
          }
          
          priceChange = adjustedImpact; // Direct dollar amount
          newPrice = currentPrice + priceChange;
        }
        
        // Enhanced price floor - use a higher minimum of $5.00 (was $1.00)
        // Plus a stock-specific floor based on typical price range
        let stockFloor = 5.00; // Default absolute minimum of $5.00 for all stocks
        
        try {
          // Lookup the stock's symbol to determine typical price range
          const symbol = stock.symbol;
          if (symbol) {
            // Set a stock-specific floor based on typical price
            const defaultPrice = 
              symbol === 'AAPL' ? 175.34 :
              symbol === 'MSFT' ? 320.45 :
              symbol === 'AMZN' ? 128.95 :
              symbol === 'GOOGL' ? 145.60 :
              symbol === 'FB' ? 302.75 :
              symbol === 'TSLA' ? 245.30 :
              symbol === 'NFLX' ? 552.80 :
              symbol === 'NVDA' ? 468.25 :
              symbol === 'DIS' ? 105.45 :
              symbol === 'JPM' ? 175.15 :
              100.00; // Default for custom stocks
            
            // Floor is 25% of default price or $5.00, whichever is higher
            stockFloor = Math.max(5.00, defaultPrice * 0.25);
          }
        } catch (e) {
          console.error('Error determining stock floor price in sector event:', e);
        }
        
        // Apply the floor to ensure price doesn't drop too low
        if (newPrice < stockFloor) {
          console.log(`📈 Floor protection: ${stock.symbol || 'Stock'} price ${newPrice.toFixed(2)} below floor ${stockFloor.toFixed(2)}`);
          newPrice = stockFloor;
        }
        
        // Update the price cache
        stockPriceCache[stock.id] = newPrice;
        
        // Update the stock object for localStorage
        stock.current_price = newPrice;
        stocksNeedUpdate = true;
        
        updatedStocks.push({
          id: stock.id,
          symbol: stock.symbol,
          previous_price: currentPrice,
          new_price: newPrice,
          change_percentage: adjustedImpact * 100
        });
      });
    } 
    else if (eventType === 'company_event' && eventData.related_stocks) {
      // Company events affect specific stocks
      const stockIds = Array.isArray(eventData.related_stocks) ? eventData.related_stocks : [];
      console.log(`Applying company impact of ${actualImpact} to ${stockIds.length} specific stocks`);
      
      // If no specific stocks, pick 1-3 random stocks
      if (stockIds.length === 0) {
        const randomCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 stocks
        const shuffledStocks = [...stocks].sort(() => Math.random() - 0.5);
        
        shuffledStocks.slice(0, randomCount).forEach(stock => {
          if (!stock || !stock.id) return;
          
          // Apply the impact with high variance for company events (±10%)
          const variance = 0.9 + Math.random() * 0.2; // 90% to 110% of the impact
          const adjustedImpact = actualImpact * variance;
          const currentPrice = stock.current_price || 100; // Fallback to 100 if no price
          
          // Calculate new price with the same approach as market/sector events
          let priceChange;
          let newPrice;
          
          // IMPROVED PRICE CALCULATION LOGIC:
          // 1. Limit negative percentage changes to prevent catastrophic drops
          // 2. Use a higher minimum price floor
          
          // If impact is very small, it's probably a percentage
          if (Math.abs(adjustedImpact) < 0.1) {
            // It's a percentage, but we need to limit negative percentages
            
            // For negative impacts, don't allow more than 5% drop in a single event
            if (adjustedImpact < 0) {
              adjustedImpact = Math.max(adjustedImpact, -0.05);
              console.log(`⚠️ Limited negative percentage impact to -5% (company event): ${adjustedImpact}`);
            }
            
            // Apply the percentage change
            newPrice = currentPrice * (1 + adjustedImpact);
          } else {
            // It's an absolute change - limit negative changes relative to stock price
            if (adjustedImpact < 0) {
              // Don't allow absolute drops greater than 5% of current price
              const maxAbsoluteDrop = currentPrice * 0.05;
              if (Math.abs(adjustedImpact) > maxAbsoluteDrop) {
                adjustedImpact = -maxAbsoluteDrop;
                console.log(`⚠️ Limited negative absolute impact to -$${maxAbsoluteDrop.toFixed(2)} (company event)`);
              }
            }
            
            priceChange = adjustedImpact; // Direct dollar amount
            newPrice = currentPrice + priceChange;
          }
          
          // Enhanced price floor - use a higher minimum of $5.00 (was $1.00)
          // Plus a stock-specific floor based on typical price range
          let stockFloor = 5.00; // Default absolute minimum of $5.00 for all stocks
          
          try {
            // Lookup the stock's symbol to determine typical price range
            const symbol = stock.symbol;
            if (symbol) {
              // Set a stock-specific floor based on typical price
              const defaultPrice = 
                symbol === 'AAPL' ? 175.34 :
                symbol === 'MSFT' ? 320.45 :
                symbol === 'AMZN' ? 128.95 :
                symbol === 'GOOGL' ? 145.60 :
                symbol === 'FB' ? 302.75 :
                symbol === 'TSLA' ? 245.30 :
                symbol === 'NFLX' ? 552.80 :
                symbol === 'NVDA' ? 468.25 :
                symbol === 'DIS' ? 105.45 :
                symbol === 'JPM' ? 175.15 :
                100.00; // Default for custom stocks
              
              // Floor is 25% of default price or $5.00, whichever is higher
              stockFloor = Math.max(5.00, defaultPrice * 0.25);
            }
          } catch (e) {
            console.error('Error determining stock floor price in company event:', e);
          }
          
          // Apply the floor to ensure price doesn't drop too low
          if (newPrice < stockFloor) {
            console.log(`📈 Floor protection: ${stock.symbol || 'Stock'} price ${newPrice.toFixed(2)} below floor ${stockFloor.toFixed(2)}`);
            newPrice = stockFloor;
          }
          
          // Update the price cache
          stockPriceCache[stock.id] = newPrice;
          
          // Update the stock object for localStorage
          stock.current_price = newPrice;
          stocksNeedUpdate = true;
          
          updatedStocks.push({
            id: stock.id,
            symbol: stock.symbol,
            previous_price: currentPrice,
            new_price: newPrice,
            change_percentage: adjustedImpact * 100
          });
        });
      } else {
        // Update the specific stocks
        stockIds.forEach(stockId => {
          const stock = stocks.find(s => s.id == stockId); // Use == to handle string vs number IDs
          if (!stock) return;
          
          // Apply the impact with high variance for company events (±10%)
          const variance = 0.9 + Math.random() * 0.2; // 90% to 110% of the impact
          const adjustedImpact = actualImpact * variance;
          const currentPrice = stock.current_price || 100; // Fallback to 100 if no price
          
          // Calculate new price with the same approach as market/sector events
          let priceChange;
          let newPrice;
          
          // IMPROVED PRICE CALCULATION LOGIC:
          // 1. Limit negative percentage changes to prevent catastrophic drops
          // 2. Use a higher minimum price floor
          
          // If impact is very small, it's probably a percentage
          if (Math.abs(adjustedImpact) < 0.1) {
            // It's a percentage, but we need to limit negative percentages
            
            // For negative impacts, don't allow more than 5% drop in a single event
            if (adjustedImpact < 0) {
              adjustedImpact = Math.max(adjustedImpact, -0.05);
              console.log(`⚠️ Limited negative percentage impact to -5% (company event): ${adjustedImpact}`);
            }
            
            // Apply the percentage change
            newPrice = currentPrice * (1 + adjustedImpact);
          } else {
            // It's an absolute change - limit negative changes relative to stock price
            if (adjustedImpact < 0) {
              // Don't allow absolute drops greater than 5% of current price
              const maxAbsoluteDrop = currentPrice * 0.05;
              if (Math.abs(adjustedImpact) > maxAbsoluteDrop) {
                adjustedImpact = -maxAbsoluteDrop;
                console.log(`⚠️ Limited negative absolute impact to -$${maxAbsoluteDrop.toFixed(2)} (company event)`);
              }
            }
            
            priceChange = adjustedImpact; // Direct dollar amount
            newPrice = currentPrice + priceChange;
          }
          
          // Enhanced price floor - use a higher minimum of $5.00 (was $1.00)
          // Plus a stock-specific floor based on typical price range
          let stockFloor = 5.00; // Default absolute minimum of $5.00 for all stocks
          
          try {
            // Lookup the stock's symbol to determine typical price range
            const symbol = stock.symbol;
            if (symbol) {
              // Set a stock-specific floor based on typical price
              const defaultPrice = 
                symbol === 'AAPL' ? 175.34 :
                symbol === 'MSFT' ? 320.45 :
                symbol === 'AMZN' ? 128.95 :
                symbol === 'GOOGL' ? 145.60 :
                symbol === 'FB' ? 302.75 :
                symbol === 'TSLA' ? 245.30 :
                symbol === 'NFLX' ? 552.80 :
                symbol === 'NVDA' ? 468.25 :
                symbol === 'DIS' ? 105.45 :
                symbol === 'JPM' ? 175.15 :
                100.00; // Default for custom stocks
              
              // Floor is 25% of default price or $5.00, whichever is higher
              stockFloor = Math.max(5.00, defaultPrice * 0.25);
            }
          } catch (e) {
            console.error('Error determining stock floor price in company event:', e);
          }
          
          // Apply the floor to ensure price doesn't drop too low
          if (newPrice < stockFloor) {
            console.log(`📈 Floor protection: ${stock.symbol || 'Stock'} price ${newPrice.toFixed(2)} below floor ${stockFloor.toFixed(2)}`);
            newPrice = stockFloor;
          }
          
          // Update the price cache
          stockPriceCache[stock.id] = newPrice;
          
          // Update the stock object for localStorage
          stock.current_price = newPrice;
          stocksNeedUpdate = true;
          
          updatedStocks.push({
            id: stock.id,
            symbol: stock.symbol,
            previous_price: currentPrice,
            new_price: newPrice,
            change_percentage: adjustedImpact * 100
          });
        });
      }
    }
    
    // If stocks were updated and we're using localStorage stocks, persist the updates
    if (stocksNeedUpdate) {
      // First check if these are from localStorage (mock stocks)
      const mockStocksJson = localStorage.getItem('mockStocksData');
      if (mockStocksJson) {
        try {
          // Parse the existing mock stocks to check if these are the same stocks
          const mockStocksCheck = JSON.parse(mockStocksJson);
          // If stock count matches, assume these are from localStorage
          if (mockStocksCheck.length === stocks.length) {
            // Save the updated stocks back to localStorage
            localStorage.setItem('mockStocksData', JSON.stringify(stocks));
            console.log(`Saved ${updatedStocks.length} stock price updates to localStorage`);
          }
        } catch (e) {
          console.error('Error saving updated stock prices to localStorage:', e);
        }
      }
    }

    // Log the updated stocks
    if (updatedStocks.length > 0) {
      console.log(`Updated ${updatedStocks.length} stocks based on ${eventType}:`);
      console.log(updatedStocks.map(s => `${s.symbol}: ${s.previous_price.toFixed(2)} → ${s.new_price.toFixed(2)} (${s.change_percentage >= 0 ? '+' : ''}${s.change_percentage.toFixed(2)}%)`).join('\n'));
    }

    return updatedStocks;
  } catch (error) {
    console.error('Error updating stocks from event:', error);
    return [];
  }
};