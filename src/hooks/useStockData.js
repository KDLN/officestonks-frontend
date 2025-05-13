import { useState, useEffect, useCallback } from 'react';
import { getUserPortfolio, getTransactionHistory, getAllStocks } from '../services/stock';
import { initWebSocket, addListener, closeWebSocket, getLatestPrice } from '../services/websocket';

/**
 * Custom hook for fetching and managing stock data with WebSocket updates
 */
const useStockData = () => {
  const [portfolio, setPortfolio] = useState({
    portfolio_items: [],
    cash_balance: 0,
    stock_value: 0,
    total_value: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to update portfolio stock prices
  const updatePortfolioWithLatestPrices = useCallback((portfolioData) => {
    if (!portfolioData || !portfolioData.portfolio_items) {
      return portfolioData;
    }
    
    let updatedStockValue = 0;
    
    const updatedItems = portfolioData.portfolio_items.map(item => {
      if (!item || !item.stock || !item.stock_id) {
        return item;
      }
      
      // Get the latest price from cache or use the current price
      const latestPrice = getLatestPrice(item.stock_id, item.stock.current_price);
      
      // Update the stock with the latest price
      const updatedStock = { ...item.stock, current_price: latestPrice };
      
      // Add to the total stock value
      updatedStockValue += item.quantity * latestPrice;
      
      return { ...item, stock: updatedStock };
    });
    
    // Update the portfolio totals
    return {
      ...portfolioData,
      portfolio_items: updatedItems,
      stock_value: updatedStockValue,
      total_value: portfolioData.cash_balance + updatedStockValue
    };
  }, []);
  
  // Function to update stock prices in the stock list
  const updateStocksWithLatestPrices = useCallback((stocksData) => {
    if (!stocksData || !Array.isArray(stocksData)) {
      return stocksData;
    }
    
    return stocksData.map(stock => {
      if (!stock || !stock.id) {
        return stock;
      }
      
      // Get the latest price from cache or use the current price
      const latestPrice = getLatestPrice(stock.id, stock.current_price);
      return { ...stock, current_price: latestPrice };
    });
  }, []);
  
  // Function to fetch all data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch portfolio, transactions, and stocks data in parallel
      const [portfolioData, transactionsData, stocksData] = await Promise.all([
        getUserPortfolio(),
        getTransactionHistory(),
        getAllStocks()
      ]);
      
      // Update data with latest prices
      const updatedPortfolio = updatePortfolioWithLatestPrices(portfolioData);
      const updatedStocks = updateStocksWithLatestPrices(stocksData);
      
      // Sort stocks by price for top stocks
      const sortedStocks = [...updatedStocks].sort((a, b) => b.current_price - a.current_price);
      const top5Stocks = sortedStocks.slice(0, 5);
      
      // Update state
      setPortfolio(updatedPortfolio);
      setTransactions(transactionsData);
      setStocks(updatedStocks);
      setTopStocks(top5Stocks);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      setLoading(false);
      console.error('Error fetching stock data:', err);
    }
  }, [updatePortfolioWithLatestPrices, updateStocksWithLatestPrices]);
  
  // Handle WebSocket stock price updates
  const handleStockUpdate = useCallback((message) => {
    // Process stock update message
    if (message.type === 'stock_update' || (message.id && message.current_price)) {
      // Extract stock_id and price - handle different message formats
      const stock_id = message.stock_id || message.id;
      const price = message.price || message.current_price;
      
      if (!stock_id || !price) {
        console.log('Missing required fields in message:', message);
        return;
      }
      
      // Update portfolio if the stock is in portfolio
      setPortfolio(prevPortfolio => {
        // If portfolio is empty, return as is
        if (!prevPortfolio || !prevPortfolio.portfolio_items) {
          return prevPortfolio;
        }
        
        // Check if any portfolio items contain this stock
        const hasStock = prevPortfolio.portfolio_items.some(
          item => item && item.stock_id === stock_id
        );
        
        // If stock not in portfolio, no update needed
        if (!hasStock) {
          return prevPortfolio;
        }
        
        // Update portfolio items
        const updatedItems = prevPortfolio.portfolio_items.map(item => {
          if (!item || !item.stock || item.stock_id !== stock_id) {
            return item;
          }
          
          const oldValue = item.quantity * (item.stock.current_price || 0);
          const newValue = item.quantity * price;
          const updatedStock = { ...item.stock, current_price: price };
          
          return {
            ...item,
            stock: updatedStock,
            valueChange: oldValue < newValue ? 'up' : 'down'
          };
        });
        
        // Recalculate stock value
        const newStockValue = updatedItems.reduce(
          (total, item) => {
            if (!item || !item.stock) return total;
            return total + (item.quantity * (item.stock.current_price || 0));
          },
          0
        );
        
        // Return updated portfolio
        return {
          ...prevPortfolio,
          portfolio_items: updatedItems,
          stock_value: newStockValue,
          total_value: (prevPortfolio.cash_balance || 0) + newStockValue
        };
      });
      
      // Update stocks list
      setStocks(prevStocks => {
        if (!prevStocks || !Array.isArray(prevStocks)) {
          return prevStocks;
        }
        
        return prevStocks.map(stock => {
          if (!stock || stock.id !== stock_id) {
            return stock;
          }
          
          return {
            ...stock,
            current_price: price,
            priceChange: (stock.current_price || 0) < price ? 'up' : 'down'
          };
        });
      });
      
      // Update top stocks
      setTopStocks(prevTopStocks => {
        if (!prevTopStocks || !Array.isArray(prevTopStocks)) {
          return prevTopStocks;
        }
        
        return prevTopStocks.map(stock => {
          if (!stock || stock.id !== stock_id) {
            return stock;
          }
          
          return {
            ...stock,
            current_price: price,
            priceChange: (stock.current_price || 0) < price ? 'up' : 'down'
          };
        });
      });
    }
  }, []);
  
  // Initialize data and WebSocket connection
  useEffect(() => {
    // Fetch initial data
    fetchData();
    
    // Initialize WebSocket
    initWebSocket();
    
    // Set up event listener for stock updates
    const removeListener = addListener('*', handleStockUpdate);
    
    // Clean up
    return () => {
      removeListener();
      closeWebSocket();
    };
  }, [fetchData, handleStockUpdate]);
  
  // Return data and handlers
  return {
    portfolio,
    transactions,
    stocks,
    topStocks,
    loading,
    error,
    refresh: fetchData
  };
};

export default useStockData;