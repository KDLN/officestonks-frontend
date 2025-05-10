import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserPortfolio } from '../services/stock';
import { getTransactionHistory } from '../services/stock';
import Navigation from '../components/Navigation';
import './Portfolio.css';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [costBasis, setCostBasis] = useState({});
  const [transactionData, setTransactionData] = useState({});

  // Fetch portfolio data
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await getUserPortfolio();
        setPortfolio(data);
        setLoading(false);

        // After getting portfolio, fetch transaction history to calculate cost basis
        const transactions = await getTransactionHistory(1000, 0); // Get a large number of transactions
        calculateCostBasis(transactions, data.portfolio_items);
      } catch (err) {
        setError('Failed to load portfolio data');
        setLoading(false);
        console.error(err);
      }
    };

    fetchPortfolio();
  }, []);

  // Calculate cost basis and average price for each stock
  const calculateCostBasis = (transactions, portfolioItems) => {
    const stockCostData = {};
    const stockTransactionData = {};

    // Initialize data structure for each stock in portfolio
    portfolioItems.forEach(item => {
      stockCostData[item.stock_id] = {
        totalCost: 0,
        totalShares: 0,
        averagePrice: 0
      };
      stockTransactionData[item.stock_id] = {
        buys: 0,
        sells: 0,
        buyValue: 0,
        sellValue: 0
      };
    });

    // Process all transactions to calculate cost basis
    transactions.forEach(transaction => {
      const { stock_id, quantity, price, transaction_type } = transaction;
      
      // Only process stocks still in portfolio
      if (!stockCostData[stock_id]) return;
      
      if (transaction_type === 'buy') {
        stockCostData[stock_id].totalCost += price * quantity;
        stockCostData[stock_id].totalShares += quantity;
        
        stockTransactionData[stock_id].buys += quantity;
        stockTransactionData[stock_id].buyValue += price * quantity;
      } else if (transaction_type === 'sell') {
        // For sells, we don't change the cost basis calculation
        // But we track them for the transaction summary
        stockTransactionData[stock_id].sells += quantity;
        stockTransactionData[stock_id].sellValue += price * quantity;
      }
    });

    // Calculate average price for each stock
    Object.keys(stockCostData).forEach(stockId => {
      const data = stockCostData[stockId];
      if (data.totalShares > 0) {
        data.averagePrice = data.totalCost / data.totalShares;
      }
    });

    setCostBasis(stockCostData);
    setTransactionData(stockTransactionData);
  };

  // Calculate gain/loss for a stock
  const calculateGainLoss = (stockId, currentPrice, shares) => {
    if (!costBasis[stockId]) return { value: 0, percentage: 0 };
    
    const costBasisValue = costBasis[stockId].averagePrice * shares;
    const currentValue = currentPrice * shares;
    const gainLossValue = currentValue - costBasisValue;
    const gainLossPercentage = costBasisValue > 0 ? (gainLossValue / costBasisValue) * 100 : 0;
    
    return {
      value: gainLossValue,
      percentage: gainLossPercentage
    };
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="portfolio-page">
        <Navigation />
        <div className="container">
          <div className="loading">Loading portfolio data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-page">
        <Navigation />
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <Navigation />
      <div className="container">
        <h1>Portfolio</h1>
        
        {/* Portfolio Summary */}
        <div className="portfolio-summary">
          <div className="summary-card">
            <h3>Cash Balance</h3>
            <div className="summary-value">{formatCurrency(portfolio.cash_balance)}</div>
          </div>
          <div className="summary-card">
            <h3>Stock Value</h3>
            <div className="summary-value">{formatCurrency(portfolio.stock_value)}</div>
          </div>
          <div className="summary-card highlight">
            <h3>Total Portfolio Value</h3>
            <div className="summary-value">{formatCurrency(portfolio.total_value)}</div>
          </div>
        </div>
        
        {/* Stock Holdings */}
        <div className="portfolio-holdings">
          <h2>Your Holdings</h2>
          
          {portfolio.portfolio_items.length === 0 ? (
            <div className="empty-portfolio">
              <p>You don't own any stocks yet.</p>
              <Link to="/stocks" className="btn primary">Browse Stocks</Link>
            </div>
          ) : (
            <div className="holdings-table-container">
              <table className="holdings-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Shares</th>
                    <th>Current Price</th>
                    <th>Average Cost</th>
                    <th>Current Value</th>
                    <th>Cost Basis</th>
                    <th>Gain/Loss</th>
                    <th>Gain/Loss %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.portfolio_items.map((item) => {
                    const { stock, quantity, stock_id } = item;
                    const currentValue = stock.current_price * quantity;
                    const averageCost = costBasis[stock_id]?.averagePrice || 0;
                    const costBasisValue = averageCost * quantity;
                    const gainLoss = calculateGainLoss(stock_id, stock.current_price, quantity);
                    const isPositive = gainLoss.value >= 0;
                    
                    return (
                      <tr key={stock_id}>
                        <td>
                          <Link to={`/stock/${stock_id}`} className="stock-link">
                            <span className="stock-symbol">{stock.symbol}</span>
                            <span className="stock-name">{stock.name}</span>
                          </Link>
                        </td>
                        <td>{quantity}</td>
                        <td>{formatCurrency(stock.current_price)}</td>
                        <td>{formatCurrency(averageCost)}</td>
                        <td>{formatCurrency(currentValue)}</td>
                        <td>{formatCurrency(costBasisValue)}</td>
                        <td className={isPositive ? 'positive' : 'negative'}>
                          {formatCurrency(gainLoss.value)}
                        </td>
                        <td className={isPositive ? 'positive' : 'negative'}>
                          {formatPercentage(gainLoss.percentage)}
                        </td>
                        <td>
                          <Link to={`/stock/${stock_id}`} className="btn small">Trade</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Trading Activity */}
        {portfolio.portfolio_items.length > 0 && (
          <div className="trading-activity">
            <h2>Trading Activity</h2>
            <div className="activity-cards">
              {portfolio.portfolio_items.map((item) => {
                const { stock, stock_id } = item;
                const transactions = transactionData[stock_id] || { buys: 0, sells: 0, buyValue: 0, sellValue: 0 };
                
                return (
                  <div className="activity-card" key={stock_id}>
                    <div className="activity-header">
                      <h3>{stock.symbol}</h3>
                      <span>{stock.name}</span>
                    </div>
                    <div className="activity-details">
                      <div className="activity-row">
                        <div className="activity-label">Shares Bought:</div>
                        <div className="activity-value">{transactions.buys}</div>
                      </div>
                      <div className="activity-row">
                        <div className="activity-label">Shares Sold:</div>
                        <div className="activity-value">{transactions.sells}</div>
                      </div>
                      <div className="activity-row">
                        <div className="activity-label">Total Buy Value:</div>
                        <div className="activity-value">{formatCurrency(transactions.buyValue)}</div>
                      </div>
                      <div className="activity-row">
                        <div className="activity-label">Total Sell Value:</div>
                        <div className="activity-value">{formatCurrency(transactions.sellValue)}</div>
                      </div>
                    </div>
                    <div className="activity-footer">
                      <Link to={`/stock/${stock_id}`} className="btn small">View Stock</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Portfolio;