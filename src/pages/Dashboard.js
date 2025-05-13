import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserPortfolio, getTransactionHistory, getAllStocks } from '../services/stock';
import { initWebSocket, addListener, closeWebSocket, getLatestPrice } from '../services/websocket';
import Navigation from '../components/Navigation';
import Chat from '../components/Chat';
import NewsFeed from '../components/NewsFeed';
import './Dashboard.css';

// Default empty states to prevent null references
const DEFAULT_PORTFOLIO = {
  portfolio_items: [],
  cash_balance: 0,
  stock_value: 0,
  total_value: 0
};

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(DEFAULT_PORTFOLIO);
  const [transactions, setTransactions] = useState([]);
  const [topStocks, setTopStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Initialize tab state with user preference if available, otherwise default to news
  const [activeTab, setActiveTab] = useState(() => {
    // Try to get saved preference from localStorage
    const savedTab = localStorage.getItem('dashboard_active_tab');
    console.log('Saved dashboard tab:', savedTab);
    return savedTab === 'portfolio' ? 'portfolio' : 'news';
  });
  
  // Log visible message on initial render to verify tab state
  console.log('Dashboard initialized with active tab:', activeTab);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch portfolio, transactions, and stocks data in parallel
        const [portfolioData, transactionsData, stocksData] = await Promise.all([
          getUserPortfolio(),
          getTransactionHistory(5), // Get 5 most recent transactions
          getAllStocks()
        ]);

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

        // Apply cached prices to stock list
        const updatedStocks = stocksData.map(stock => {
          if (stock && stock.id) {
            // Get the latest price from cache or use the current price
            const latestPrice = getLatestPrice(stock.id, stock.current_price);
            return { ...stock, current_price: latestPrice };
          }
          return stock;
        });

        setPortfolio(portfolioData);
        setTransactions(transactionsData);

        // Get top 5 stocks by price
        const sortedStocks = [...updatedStocks].sort((a, b) => b.current_price - a.current_price);
        setTopStocks(sortedStocks.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();

    // Initialize WebSocket connection
    initWebSocket();

    // Listen for stock updates to refresh data
    const removeListener = addListener('*', (message) => {
      // Log the message for debugging
      console.log('Received message on dashboard:', message);

      // Process stock update message
      if (message.type === 'stock_update' || (message.id && message.current_price)) {
        // Extract stock_id and price - handle different message formats
        const stock_id = message.stock_id || message.id;
        const price = message.price || message.current_price;

        if (!stock_id || !price) {
          console.log('Missing required fields in message:', message);
          return;
        }

        // Update portfolio stocks if affected
        setPortfolio(prevPortfolio => {
          // If portfolio is null or undefined, use the default empty portfolio
          const portfolio = prevPortfolio || DEFAULT_PORTFOLIO;
          if (!portfolio.portfolio_items) {
            return portfolio;
          }

          // Update portfolio items if the stock is in portfolio
          const updatedItems = portfolio.portfolio_items.map(item => {
            if (!item || !item.stock) return item;

            if (item.stock_id === stock_id) {
              const oldValue = item.quantity * (item.stock.current_price || 0);
              const newValue = item.quantity * price;
              const updatedStock = { ...item.stock, current_price: price };

              return {
                ...item,
                stock: updatedStock,
                valueChange: oldValue < newValue ? 'up' : 'down'
              };
            }
            return item;
          });

          // Recalculate stock value with null safety
          const newStockValue = updatedItems.reduce(
            (total, item) => {
              if (!item || !item.stock) return total;
              return total + (item.quantity * (item.stock.current_price || 0));
            },
            0
          );

          return {
            ...portfolio,
            portfolio_items: updatedItems,
            stock_value: newStockValue,
            total_value: (portfolio.cash_balance || 0) + newStockValue
          };
        });

        // Update top stocks if affected
        setTopStocks(prevTopStocks => {
          if (!prevTopStocks || !Array.isArray(prevTopStocks)) {
            return prevTopStocks || [];
          }

          return prevTopStocks.map(stock => {
            if (!stock) return stock;

            if (stock.id === stock_id) {
              return {
                ...stock,
                current_price: price,
                priceChange: (stock.current_price || 0) < price ? 'up' : 'down'
              };
            }
            return stock;
          });
        });
      }
    });

    // Clean up on unmount
    return () => {
      removeListener();
      closeWebSocket();
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Add a visible console log to help debug which tab is active
  console.log('Current active tab:', activeTab);

  return (
    <div className="dashboard-page">
      <Navigation />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="portfolio-value">
            <h2>Total Portfolio Value</h2>
            <div className="value">${(portfolio?.total_value || 0).toFixed(2)}</div>
            <div className="portfolio-breakdown">
              <div className="breakdown-item">
                <span>Cash:</span>
                <span>${(portfolio?.cash_balance || 0).toFixed(2)}</span>
              </div>
              <div className="breakdown-item">
                <span>Stocks:</span>
                <span>${(portfolio?.stock_value || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            id="portfolio-tab-button"
            className={`tab-button ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => {
              console.log('Switching to portfolio tab');
              setActiveTab('portfolio');
              // Save preference
              try {
                localStorage.setItem('dashboard_active_tab', 'portfolio');
                console.log('Saved tab preference: portfolio');
              } catch (e) {
                console.warn('Could not save tab preference', e);
              }
            }}
          >
            Portfolio & Stocks
          </button>
          <button 
            id="news-tab-button"
            className={`tab-button ${activeTab === 'news' ? 'active' : ''}`}
            onClick={() => {
              console.log('Switching to news tab');
              setActiveTab('news');
              // Save preference
              try {
                localStorage.setItem('dashboard_active_tab', 'news');
                console.log('Saved tab preference: news');
              } catch (e) {
                console.warn('Could not save tab preference', e);
              }
            }}
            style={{ 
              position: 'relative',
              backgroundColor: activeTab === 'news' ? '#1976d2' : '',
              color: activeTab === 'news' ? 'white' : '',
              fontWeight: 'bold'
            }}
          >
            Market News
            {activeTab !== 'news' && (
              <span style={{ 
                position: 'absolute', 
                top: '-8px', 
                right: '-8px', 
                background: '#ff5722', 
                color: 'white', 
                borderRadius: '50%', 
                padding: '2px 6px', 
                fontSize: '10px' 
              }}>
                New
              </span>
            )}
          </button>
        </div>
        
        {/* Debug info for tab rendering */}
        <div style={{ display: 'none' }}>
          Current active tab: {activeTab}
          Should show portfolio: {activeTab === 'portfolio' ? 'Yes' : 'No'}
          Should show news: {activeTab === 'news' ? 'Yes' : 'No'}
        </div>
        
        {activeTab === 'portfolio' ? (
          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Your Portfolio</h2>
                <Link to="/portfolio" className="view-all">View All</Link>
              </div>
              
              {portfolio?.portfolio_items && portfolio.portfolio_items.length > 0 ? (
                <div className="portfolio-list">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Shares</th>
                        <th>Price</th>
                        <th>Value</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.portfolio_items?.slice(0, 3).map(item => item && item.stock ? (
                        <tr
                          key={item.stock_id}
                          className={item.valueChange ? `value-${item.valueChange}` : ''}
                        >
                          <td>{item.stock.symbol}</td>
                          <td>{item.quantity}</td>
                          <td>${(item.stock.current_price || 0).toFixed(2)}</td>
                          <td>${(item.quantity * (item.stock.current_price || 0)).toFixed(2)}</td>
                          <td>
                            <Link to={`/stock/${item.stock_id}`} className="trade-button">
                              Trade
                            </Link>
                          </td>
                        </tr>
                      ) : null)}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-list">
                  <p>You don't own any stocks yet.</p>
                  <Link to="/stocks" className="action-button">Start Trading</Link>
                </div>
              )}
            </div>
            
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Top Stocks</h2>
                <Link to="/stocks" className="view-all">View All</Link>
              </div>
              
              <div className="top-stocks-list">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStocks && topStocks.length > 0 ? topStocks.map(stock => stock ? (
                      <tr
                        key={stock.id}
                        className={stock.priceChange ? `price-${stock.priceChange}` : ''}
                      >
                        <td>{stock.symbol}</td>
                        <td>{stock.name}</td>
                        <td>${(stock.current_price || 0).toFixed(2)}</td>
                        <td>
                          <Link to={`/stock/${stock.id}`} className="trade-button">
                            Trade
                          </Link>
                        </td>
                      </tr>
                    ) : null) : (
                      <tr>
                        <td colSpan="4" className="empty-message">No stocks available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Recent Transactions</h2>
                <Link to="/transactions" className="view-all">View All</Link>
              </div>
              
              <div className="transactions-list">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stock</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions && transactions.length > 0 ? transactions.map(transaction => transaction && transaction.stock ? (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.created_at).toLocaleDateString()}</td>
                        <td>{transaction.stock.symbol}</td>
                        <td className={`transaction-type ${transaction.transaction_type}`}>
                          {transaction.transaction_type}
                        </td>
                        <td>{transaction.quantity}</td>
                        <td>${(transaction.price || 0).toFixed(2)}</td>
                        <td>${(transaction.quantity * (transaction.price || 0)).toFixed(2)}</td>
                      </tr>
                    ) : null) : (
                      <tr>
                        <td colSpan="6" className="empty-message">No recent transactions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="dashboard-content news-tab-content" style={{ animation: 'fadeIn 0.5s ease' }}>
            {/* Unified styling for news section with NewsFeed component */}
            <div className="dashboard-section" style={{ padding: 0, overflow: 'hidden' }}>
              {/* News tab header and instructions */}
              <div className="news-header-section" style={{
                padding: '15px 20px', 
                background: 'linear-gradient(to right, #1976d2, #2196f3)',
                color: 'white',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>Market News & Events</h2>
                <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5', opacity: '0.9' }}>
                  Stay up-to-date with the latest market events, sector changes, and company news.
                  All updates appear in real-time via WebSocket connection.
                </p>
              </div>
              
              {/* Render the NewsFeed component */}
              <NewsFeed />
            </div>
          </div>
        )}
      </div>

      {/* Chat Component */}
      <Chat />
    </div>
  );
};

export default Dashboard;