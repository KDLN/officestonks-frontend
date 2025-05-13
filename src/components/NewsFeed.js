import React, { useState, useEffect } from 'react';
import { getRecentNews } from '../services/news';
import { addListener } from '../services/websocket';
import './NewsFeed.css';

const NewsItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Format the published date
  const formattedDate = new Date(item.published_at).toLocaleString();
  
  // Determine importance class (1-5 scale)
  const importanceClass = `importance-${item.importance || 1}`;
  
  // Determine event type badge class
  const getEventTypeBadge = () => {
    switch(item.event_type) {
      case 'market_event':
        return <span className="badge market-event">Market</span>;
      case 'sector_event':
        return <span className="badge sector-event">Sector</span>;
      case 'company_event':
        return <span className="badge company-event">Company</span>;
      default:
        return null;
    }
  };
  
  // Format price impact
  const formatPriceImpact = () => {
    if (!item.price_impact && item.price_impact !== 0) return null;
    
    const impact = item.price_impact * 100;
    const className = impact >= 0 ? 'positive-impact' : 'negative-impact';
    const sign = impact >= 0 ? '+' : '';
    
    return (
      <span className={`price-impact ${className}`}>
        {sign}{impact.toFixed(2)}%
      </span>
    );
  };
  
  return (
    <div className={`news-item ${importanceClass}`}>
      <div className="news-header" onClick={() => setExpanded(!expanded)}>
        <h3 className="news-headline">
          {getEventTypeBadge()}
          {item.headline}
          {formatPriceImpact()}
        </h3>
        <div className="news-meta">
          <span className="news-date">{formattedDate}</span>
          <span className="expand-indicator">{expanded ? '▼' : '►'}</span>
        </div>
      </div>
      
      {expanded && (
        <div className="news-content">
          <p className="news-summary">{item.summary}</p>
          {item.body && <div className="news-body">{item.body}</div>}
          
          {(item.related_stocks?.length > 0 || item.related_sectors?.length > 0) && (
            <div className="news-related">
              {item.related_stocks?.length > 0 && (
                <div className="related-stocks">
                  <strong>Related Stocks:</strong> {item.related_stocks.join(', ')}
                </div>
              )}
              
              {item.related_sectors?.length > 0 && (
                <div className="related-sectors">
                  <strong>Related Sectors:</strong> {item.related_sectors.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const NewsFeed = ({ stockId, sectorId }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'market', 'sector', 'company'
  const [minImportance, setMinImportance] = useState(1); // 1-5 scale
  
  // Load initial news data
  useEffect(() => {
    console.log("NewsFeed component mounted");
    const loadNews = async () => {
      try {
        setLoading(true);
        console.log("Fetching news data...");
        const response = await getRecentNews(20);
        console.log("News data received:", response);
        setNews(response);
        setError(null);
      } catch (err) {
        console.error('Error loading news:', err);
        setError('Failed to load news feed. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadNews();
  }, [stockId, sectorId]);
  
  // Listen for news updates via direct addListener call (without hook)
  useEffect(() => {
    console.log("Setting up news listeners");
    
    // Set up listener for news updates
    const removeNewsListener = addListener('news_item', (message) => {
      console.log("Received news item:", message);
      // Add the new news item to the top of the list
      setNews(prevNews => [message, ...prevNews]);
    });
    
    // Listen for market events
    const removeMarketListener = addListener('market_event', (message) => {
      console.log("Received market event:", message);
      // Create a news-like item from market event
      const newsItem = {
        id: `market-${Date.now()}`,
        headline: `Market Event: ${message.name || 'Market Update'}`,
        summary: message.description || 'Market-wide event affecting all stocks',
        body: message.description,
        importance: Math.ceil(Math.abs(message.impact || 0.02) * 50), // Convert impact to 1-5 scale
        event_type: 'market_event',
        published_at: new Date(),
        price_impact: message.impact
      };
      
      // Add to news feed
      setNews(prevNews => [newsItem, ...prevNews]);
    });
    
    // Listen for sector events
    const removeSectorListener = addListener('sector_event', (message) => {
      console.log("Received sector event:", message);
      
      // Only add sector event to news if it matches our sectorId or no specific sector filter
      const relevantToCurrentView = !sectorId || (message.sectors && message.sectors.includes(sectorId));
      
      if (relevantToCurrentView) {
        // Create news item from sector event
        const newsItem = {
          id: `sector-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          headline: `Sector Event: ${message.name || 'Sector Update'}`,
          summary: message.description || `Event affecting sector performance`,
          body: message.description,
          importance: Math.ceil(Math.abs(message.impact || 0.02) * 50), // Convert impact to 1-5 scale
          event_type: 'sector_event',
          published_at: new Date(),
          price_impact: message.impact,
          related_sectors: message.sectors
        };
        
        // Add to news feed
        setNews(prevNews => [newsItem, ...prevNews]);
      }
    });
    
    // Listen for company events
    const removeCompanyListener = addListener('company_event', (message) => {
      console.log("Received company event:", message);
      
      // Only add company event to news if it matches our stockId or no specific stock filter
      const stockIdNum = stockId ? parseInt(stockId, 10) : null;
      const relevantToCurrentView = !stockIdNum || (message.stock_ids && message.stock_ids.includes(stockIdNum));
      
      if (relevantToCurrentView) {
        // Create news item from company event
        const newsItem = {
          id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          headline: `Company Event: ${message.name || 'Company Update'}`,
          summary: message.description || `Event affecting company performance`,
          body: message.description,
          importance: Math.ceil(Math.abs(message.impact || 0.02) * 50), // Convert impact to 1-5 scale
          event_type: 'company_event',
          published_at: new Date(),
          price_impact: message.impact,
          related_stocks: message.stock_ids
        };
        
        // Add to news feed
        setNews(prevNews => [newsItem, ...prevNews]);
      }
    });
    
    // Debug message
    console.log("News listeners set up successfully");
    
    // Clean up listener on unmount
    return () => {
      console.log("Cleaning up news listeners");
      removeNewsListener();
      removeMarketListener();
      removeSectorListener();
      removeCompanyListener();
    };
  }, [stockId, sectorId]);
  
  // Filter news items based on current filters
  const filteredNews = news.filter(item => {
    // Filter by importance
    if (!item || (item.importance && item.importance < minImportance)) {
      return false;
    }
    
    // Filter by event type
    if (filter === 'all') return true;
    if (filter === 'market' && item.event_type === 'market_event') return true;
    if (filter === 'sector' && item.event_type === 'sector_event') return true;
    if (filter === 'company' && item.event_type === 'company_event') return true;
    
    return false;
  });
  
  return (
    <div className="news-feed-container">
      <div className="news-feed-header">
        <h2>Market News Feed</h2>
        
        <div className="news-filters">
          <div className="filter-group">
            <label htmlFor="event-filter">Event Type:</label>
            <select 
              id="event-filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="market">Market</option>
              <option value="sector">Sector</option>
              <option value="company">Company</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="importance-filter">Min Importance:</label>
            <select 
              id="importance-filter" 
              value={minImportance} 
              onChange={(e) => setMinImportance(parseInt(e.target.value))}
            >
              <option value="1">All (1+)</option>
              <option value="2">Notable (2+)</option>
              <option value="3">Important (3+)</option>
              <option value="4">Very Important (4+)</option>
              <option value="5">Critical (5)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="news-feed-content">
        {loading ? (
          <div className="news-loading">Loading news feed...</div>
        ) : error ? (
          <div className="news-error">{error}</div>
        ) : filteredNews.length === 0 ? (
          <div className="news-empty">No news items match your current filters.</div>
        ) : (
          filteredNews.map((item, index) => (
            <NewsItem key={item?.id || `news-${index}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
};

export default NewsFeed;