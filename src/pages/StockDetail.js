import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStockById, executeTrade, getUserPortfolio } from '../services/stock';
import { initWebSocket, addListener, closeWebSocket, getLatestPrice } from '../services/websocket';
import Navigation from '../components/Navigation';
import './StockDetail.css';

const StockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const stockId = parseInt(id);

  const [stock, setStock] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Define a fetch function that can be reused
  const fetchData = async () => {
    try {
      const [stockData, portfolioData] = await Promise.all([
        getStockById(stockId),
        getUserPortfolio()
      ]);

      // Apply cached price to stock if available
      if (stockData && stockData.id) {
        const latestPrice = getLatestPrice(stockData.id, stockData.current_price);
        stockData.current_price = latestPrice;
      }

      // Apply cached prices to portfolio items
      if (portfolioData && portfolioData.portfolio_items) {
        let updatedStockValue = 0;

        portfolioData.portfolio_items = portfolioData.portfolio_items.map(item => {
          if (item && item.stock && item.stock_id) {
            // Get the latest price from cache or use the current price
            const latestPrice = getLatestPrice(item.stock_id, item.stock.current_price);

            // Update the stock with the latest price
            item.stock.current_price = latestPrice;

            // Add to the total stock value
            updatedStockValue += item.quantity * latestPrice;
          }
          return item;
        });

        // Update the portfolio totals
        portfolioData.stock_value = updatedStockValue;
        portfolioData.total_value = portfolioData.cash_balance + updatedStockValue;
      }

      setStock(stockData);
      setPortfolio(portfolioData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load stock data. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch stock and portfolio data
  useEffect(() => {
    console.log(`StockDetail component mounted for stock ID: ${stockId}`);
    
    // Initial data fetch
    fetchData();

    // Initialize WebSocket connection
    initWebSocket();

    // Listen for stock price updates
    const stockUpdateListener = addListener('stock_update', (message) => {
      if (message.stock_id === stockId) {
        setStock(prevStock => {
          if (!prevStock) return null;
          
          // Determine price change direction
          const direction = prevStock.current_price < message.price ? 'up' : 'down';
          setPriceChange(direction);
          
          // Clear price change indicator after animation
          setTimeout(() => setPriceChange(null), 2000);
          
          return {
            ...prevStock,
            current_price: message.price
          };
        });
      }
    });

    // Listen for custom events from admin actions
    const handleStockReset = () => {
      console.log('Stock prices reset - refreshing stock details');
      fetchData();
    };

    const handleStockEdited = (event) => {
      // Check if the edited stock is the one we're viewing
      if (event && event.detail && event.detail.stockId === stockId) {
        console.log(`Current stock edited - refreshing details for stock ID: ${stockId}`);
        fetchData();
      }
    };

    // Add DOM event listeners for these custom events
    document.addEventListener('admin-stocks-reset-complete', handleStockReset);
    document.addEventListener('stock-edit-complete', handleStockEdited);
    document.addEventListener('stock-price-cache-cleared', handleStockReset);
    document.addEventListener('system-reset-complete', handleStockReset);

    // Cleanup on unmount
    return () => {
      stockUpdateListener();
      closeWebSocket();
      
      // Remove custom event listeners
      document.removeEventListener('admin-stocks-reset-complete', handleStockReset);
      document.removeEventListener('stock-edit-complete', handleStockEdited);
      document.removeEventListener('stock-price-cache-cleared', handleStockReset);
      document.removeEventListener('system-reset-complete', handleStockReset);
      
      console.log(`StockDetail component unmounted for stock ID: ${stockId}`);
    };
  }, [stockId]);

  // Calculate max quantity for sell action
  const maxSellQuantity = portfolio?.portfolio_items
    ?.find(item => item.stock_id === stockId)?.quantity || 0;

  // Calculate max buy quantity based on cash balance
  const maxBuyQuantity = stock && portfolio
    ? Math.floor(portfolio.cash_balance / stock.current_price)
    : 0;

  // Update quantity if current value exceeds max
  useEffect(() => {
    if (action === 'buy' && quantity > maxBuyQuantity && maxBuyQuantity > 0) {
      setQuantity(maxBuyQuantity);
    } else if (action === 'sell' && quantity > maxSellQuantity && maxSellQuantity > 0) {
      setQuantity(maxSellQuantity);
    }
  }, [action, maxBuyQuantity, maxSellQuantity, quantity]);

  // Handle trade execution
  const handleTrade = async (e) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    if (action === 'sell' && quantity > maxSellQuantity) {
      setError('You do not own enough shares to sell this quantity');
      return;
    }

    if (action === 'buy') {
      const totalCost = stock.current_price * quantity;
      if (totalCost > portfolio.cash_balance) {
        setError('You do not have enough cash for this purchase');
        return;
      }
    }
    
    setError(null);
    setSuccess(null);
    setExecuting(true);
    
    try {
      await executeTrade(stockId, quantity, action);
      
      // Refresh portfolio data after successful trade
      const portfolioData = await getUserPortfolio();
      setPortfolio(portfolioData);
      
      setSuccess(`Successfully ${action === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${stock.symbol}`);
      setExecuting(false);
    } catch (err) {
      setError(err.message || 'Failed to execute trade. Please try again.');
      setExecuting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading stock data...</div>;
  }

  if (!stock) {
    return <div className="error">Stock not found</div>;
  }

  // Calculate total cost for the current transaction
  const totalCost = stock.current_price * quantity;

  // Find if the user owns this stock
  const ownedStock = portfolio?.portfolio_items?.find(item => item.stock_id === stockId);

  return (
    <div className="stock-detail-page">
      <Navigation />
      <div className="stock-detail-container">
        <div className="stock-header">
          <h1>
            {stock.symbol} - {stock.name}
            <span className="sector-tag">{stock.sector}</span>
          </h1>
          <div className={`stock-price ${priceChange ? `price-${priceChange}` : ''}`}>
            ${stock.current_price.toFixed(2)}
          </div>
        </div>
        
        <div className="trade-container">
          <div className="user-portfolio-summary">
            <h2>Your Portfolio</h2>
            <p className="cash-balance">Cash: <b>${portfolio?.cash_balance.toFixed(2)}</b></p>
            
            {ownedStock && (
              <div className="owned-stock">
                <p>You own: <b>{ownedStock.quantity} shares</b></p>
                <p>Value: <b>${(ownedStock.quantity * stock.current_price).toFixed(2)}</b></p>
              </div>
            )}
          </div>
          
          <div className="trade-form-container">
            <h2>Trade {stock.symbol}</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleTrade} className="trade-form">
              <div className="form-group">
                <label htmlFor="action">Action</label>
                <select 
                  id="action" 
                  value={action} 
                  onChange={(e) => setAction(e.target.value)}
                  disabled={executing}
                >
                  <option value="buy">Buy</option>
                  <option value="sell" disabled={!maxSellQuantity}>Sell</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity">Quantity</label>
                <input 
                  id="quantity" 
                  type="number" 
                  min="1" 
                  max={action === 'buy' ? maxBuyQuantity : maxSellQuantity}
                  value={quantity} 
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  disabled={executing}
                />
                <span className="max-quantity">
                  Max: {action === 'buy' ? maxBuyQuantity : maxSellQuantity}
                </span>
              </div>
              
              <div className="form-group">
                <label>Total {action === 'buy' ? 'Cost' : 'Proceeds'}</label>
                <div className="total-cost">${totalCost.toFixed(2)}</div>
              </div>
              
              <button 
                type="submit" 
                className={`trade-button ${action}-button`}
                disabled={
                  executing || 
                  (action === 'buy' && maxBuyQuantity === 0) || 
                  (action === 'sell' && maxSellQuantity === 0)
                }
              >
                {executing ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} ${stock.symbol}`}
              </button>
            </form>
          </div>
        </div>
        
        <div className="action-buttons">
          <button onClick={() => navigate('/stocks')} className="back-button">
            Back to Stocks
          </button>
          <button onClick={() => navigate('/portfolio')} className="portfolio-button">
            View Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;