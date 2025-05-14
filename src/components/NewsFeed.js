import React, { useState, useEffect } from 'react';
import { getRecentNews } from '../services/news';
import { getNewsViaProxy } from '../services/public-proxy';
import { addListener } from '../services/websocket';
import { sampleNewsItems, simulateNewsUpdate } from '../utils/news-test-data';
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
  
  // Render impact options if available
  const renderImpactOptions = () => {
    if (!item.impact_options || !Array.isArray(item.impact_options) || item.impact_options.length === 0) {
      return null;
    }
    
    return (
      <div className="impact-options">
        <h4>Potential Price Impacts:</h4>
        <div className="impact-options-list">
          {item.impact_options.map((option, index) => {
            const className = option.value >= 0 ? 'positive-impact' : 'negative-impact';
            return (
              <div 
                key={`impact-${index}`} 
                className={`impact-option ${className} ${option.is_actual ? 'actual-impact' : ''}`}
              >
                <span className="impact-value">{option.formatted}</span>
                {option.is_actual && <span className="actual-marker">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
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
          
          {/* Display impact options if available */}
          {renderImpactOptions()}
          
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
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'market', 'sector', 'company'
  const [minImportance, setMinImportance] = useState(1); // 1-5 scale
  
  // Add a reload button functionality
  const reloadNews = async () => {
    if (loading) return; // Prevent multiple simultaneous loads
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("NewsFeed: Manual reload initiated");
      
      // Set a timeout for the reload operation
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Reload timed out after 5 seconds')), 5000)
      );
      
      // Create a promise for the news fetch
      const newsPromise = (async () => {
        const response = await getRecentNews(20);
        console.log("NewsFeed: Manual reload response:", response);
        
        if (response && Array.isArray(response) && response.length > 0) {
          return response;
        } else {
          throw new Error('Invalid or empty data returned during reload');
        }
      })();
      
      // Race between the news fetch and timeout
      try {
        const newsData = await Promise.race([newsPromise, timeoutPromise]);
        setNews(newsData);
        setMessage('News feed refreshed successfully');
        setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
      } catch (reloadError) {
        console.error('Manual reload failed:', reloadError);
        
        // Format user-friendly error
        const errorMessage = reloadError.message.includes('CORS') 
          ? 'CORS policy error during reload' 
          : reloadError.message.includes('timed out')
            ? 'Reload timed out - using sample data instead' 
            : `Reload failed: ${reloadError.message}`;
        
        setError(errorMessage);
        
        // Always use sample data if reload fails
        const sampleData = getSampleNewsItems(); 
        setNews(sampleData);
      }
    } catch (err) {
      // Last resort fallback
      console.error('Critical error during manual reload:', err);
      setError('Unable to reload news feed. Using sample data instead.');
      
      // Even in worst case, provide sample data
      const sampleData = getSampleNewsItems();
      setNews(sampleData);
    } finally {
      setLoading(false);
    }
  };
  
  // Load initial news data
  useEffect(() => {
    console.log("NewsFeed component mounted - Starting to load data");
    const getSampleNewsItems = () => {
    // Helper function to consistently prepare sample data
    return sampleNewsItems.map(item => ({
      ...item,
      // Ensure published_at is a Date object for consistent rendering
      published_at: typeof item.published_at === 'string' ? new Date(item.published_at) : item.published_at,
      // Ensure importance exists (default to 1)
      importance: item.importance || 1
    }));
  };
  
  const loadNews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("NewsFeed: Fetching news data...");
      
      // Add API URL debugging
      const { API_URL } = await import('../config/api');
      console.log('Current API URL configuration:', API_URL);
      
      // Set a timeout for the entire loading process
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('News fetch timed out after 10 seconds')), 10000)
      );
      
      // Create a promise race between the news fetch and the timeout
      const newsPromise = (async () => {
        try {
          // First method: Regular API via enhanced getRecentNews
          console.log("NewsFeed: Attempting to fetch news data");
          const response = await getRecentNews(20);
          console.log("NewsFeed: Data received:", response);
          
          if (response && Array.isArray(response) && response.length > 0) {
            console.log(`NewsFeed: Setting ${response.length} news items from API`);
            return response;
          } else {
            console.warn("NewsFeed: API returned empty or invalid data shape");
            throw new Error('Invalid or empty data returned from API');
          }
        } catch (error) {
          console.warn('NewsFeed: Enhanced news fetch failed:', error);
          throw error; // Let the next level catch handle this
        }
      })();
      
      // Race between the news fetch and the timeout
      try {
        const newsData = await Promise.race([newsPromise, timeoutPromise]);
        setNews(newsData);
        setError(null);
      } catch (raceError) {
        console.error('NewsFeed: News fetch race failed:', raceError);
        
        // Format a user-friendly error message
        const errorMessage = raceError.message.includes('CORS') 
          ? 'CORS policy error - Backend may not allow requests from this origin' 
          : raceError.message.includes('NetworkError') || raceError.message.includes('timed out')
            ? 'Network error - Unable to connect to the news API' 
            : `API error: ${raceError.message}`;
        
        setError(`${errorMessage} - Using sample data instead`);
        
        // Always use sample data if the API fails
        console.log("NewsFeed: Using sample news data as fallback");
        const sampleData = getSampleNewsItems();
        setNews(sampleData);
      }
    } catch (err) {
      // This is the very last fallback if everything else failed
      console.error('NewsFeed: Critical error loading news:', err);
      setError('Unable to load news feed. Using sample data instead.');
      
      // Even in the worst case, still provide some data
      console.log("NewsFeed: Using sample data as last resort");
      const sampleData = getSampleNewsItems();
      setNews(sampleData);
    } finally {
      setLoading(false);
    }
  };
    
    loadNews();
  }, [stockId, sectorId]);
  
  // Listen for WebSocket connection events
  useEffect(() => {
    const handleWebSocketConnected = () => {
      console.log("WebSocket connected event detected in NewsFeed component");
      setError(null); // Clear any previous errors
    };
    
    const handleWebSocketClosed = (event) => {
      console.log("WebSocket closed event detected in NewsFeed component", event.detail);
      setError(`WebSocket connection closed (code: ${event.detail.code}). Reconnecting...`);
    };
    
    const handleWebSocketError = (event) => {
      console.log("WebSocket error event detected in NewsFeed component", event.detail);
      setError(`WebSocket error: ${event.detail.error || 'Connection failed'}`);
    };
    
    // Add DOM event listeners for WebSocket status
    document.addEventListener('websocket-connected', handleWebSocketConnected);
    document.addEventListener('websocket-closed', handleWebSocketClosed);
    document.addEventListener('websocket-error', handleWebSocketError);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('websocket-connected', handleWebSocketConnected);
      document.removeEventListener('websocket-closed', handleWebSocketClosed);
      document.removeEventListener('websocket-error', handleWebSocketError);
    };
  }, []);

  // Listen for news updates via direct addListener call (without hook)
  useEffect(() => {
    console.log("Setting up news listeners");
    
    // Add WebSocket connection status to the component
    let connectionStatus = 'connecting';
    try {
      // Check if socket exists
      if (window.socket) {
        connectionStatus = window.socket.readyState === 1 ? 'connected' : 
                          window.socket.readyState === 0 ? 'connecting' : 
                          window.socket.readyState === 2 ? 'closing' : 'closed';
        console.log(`Current WebSocket state: ${connectionStatus} (${window.socket.readyState})`);
      } else {
        console.warn('WebSocket not initialized yet');
      }
    } catch (e) {
      console.error('Error checking WebSocket status:', e);
    }
    
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
        price_impact: message.impact,
        impact_options: message.impact_options || [] // Add impact options if available
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
          impact_options: message.impact_options || [], // Add impact options if available
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
          impact_options: message.impact_options || [], // Add impact options if available
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
    // Safety check for null/undefined items
    if (!item) return false;
    
    // Create a debug console log to see what's happening
    console.log('Filtering item:', { 
      headline: item.headline, 
      importance: item.importance, 
      event_type: item.event_type,
      passes_filter: filter === 'all' || 
                    (filter === 'market' && item.event_type === 'market_event') ||
                    (filter === 'sector' && item.event_type === 'sector_event') ||
                    (filter === 'company' && item.event_type === 'company_event')
    });
    
    // Filter by importance - NOTE: Default to importance 1 if not specified
    const itemImportance = typeof item.importance === 'number' ? item.importance : 1;
    if (itemImportance < minImportance) {
      return false;
    }
    
    // Filter by event type
    if (filter === 'all') return true;
    if (filter === 'market' && item.event_type === 'market_event') return true;
    if (filter === 'sector' && item.event_type === 'sector_event') return true;
    if (filter === 'company' && item.event_type === 'company_event') return true;
    
    return false;
  });
  
  // Function to generate test news item
  const generateTestNewsItem = () => {
    simulateNewsUpdate((newsItem) => {
      console.log('Generated test news item:', newsItem);
      setNews(prevNews => [newsItem, ...prevNews]);
    });
  };

  return (
    <div className="news-feed-container">
      <div className="news-feed-header">
        <h2>Market News Feed</h2>
        {/* Debug info section - API URL and Connection status */}
        <div className="debug-info" style={{ fontSize: '12px', marginBottom: '10px', color: '#666' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <div>Status: {loading ? 'Loading...' : error ? 'Error' : message ? 'Success' : 'Loaded'}</div>
            <div>
              Connection: <span style={{
                color: window.socket && window.socket.readyState === 1 ? '#4caf50' : '#f44336',
                fontWeight: 'bold'
              }}>
                {window.socket ? 
                  window.socket.readyState === 0 ? 'Connecting...' :
                  window.socket.readyState === 1 ? 'Connected' :
                  window.socket.readyState === 2 ? 'Closing' : 'Disconnected'
                : 'Not initialized'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>Items: <span style={{ fontWeight: 'bold' }}>{filteredNews.length}</span> ({news.length} total)</div>
            <button 
              onClick={generateTestNewsItem}
              style={{ 
                marginLeft: '10px',
                padding: '3px 8px', 
                fontSize: '11px', 
                background: '#4caf50', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              Add Test Item
            </button>
          </div>
          {message && (
            <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#4caf50', fontSize: '11px', fontWeight: 'bold' }}>{message}</div>
            </div>
          )}
          {error && (
            <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ color: '#d32f2f', fontSize: '11px' }}>{error}</div>
              <button 
                onClick={reloadNews}
                style={{ 
                  padding: '3px 8px', 
                  fontSize: '11px', 
                  background: '#1976d2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Retry Loading
              </button>
            </div>
          )}  
        </div>
        
        <div className="news-filters">
          <div className="filter-group">
            <label htmlFor="event-filter">Event Type:</label>
            <select 
              id="event-filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
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
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value="1">All (1+)</option>
              <option value="2">Notable (2+)</option>
              <option value="3">Important (3+)</option>
              <option value="4">Very Important (4+)</option>
              <option value="5">Critical (5)</option>
            </select>
          </div>
          
          {/* Frequency controls moved to admin panel */}
        </div>
      </div>
      
      <div className="news-feed-content">
        {loading ? (
          <div className="news-loading">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ marginBottom: '10px', fontSize: '18px' }}>Loading news feed...</div>
            <div style={{ color: '#666', fontSize: '14px' }}>Connecting to WebSocket for real-time updates</div>
          </div>
        </div>
        ) : error ? (
          <div className="news-error" style={{ padding: '15px', background: '#ffeeee', borderRadius: '4px', margin: '10px', color: '#d32f2f' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error Loading News</div>
            <div>{error}</div>
            <div style={{ marginTop: '8px', fontSize: '12px' }}>Using sample data until connection is restored.</div>
          </div>
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