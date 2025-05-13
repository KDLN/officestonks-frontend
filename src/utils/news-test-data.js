/**
 * Sample news data for testing the NewsFeed component
 * This file provides mock data that can be used to test the NewsFeed component
 * without requiring a backend connection.
 */

// Sample news items with various event types and importance levels
export const sampleNewsItems = [
  {
    id: 'market-event-1',
    headline: 'Market Event: Federal Reserve Cuts Interest Rates',
    summary: 'The Federal Reserve announced a 0.25% cut in interest rates, citing economic concerns.',
    body: 'In a surprise move, the Federal Reserve has cut interest rates by 0.25%, marking the first rate cut in over a year. The decision was made in response to slowing economic growth and concerns about inflation.',
    event_type: 'market_event',
    importance: 5, // Critical importance
    published_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    price_impact: 0.05 // 5% positive impact
  },
  {
    id: 'sector-event-1',
    headline: 'Sector Event: Technology Stocks Rally on AI Advancements',
    summary: 'Technology sector stocks are rallying following announcements of major AI breakthroughs.',
    body: 'Technology stocks are seeing significant gains today following announcements from several major companies about breakthroughs in artificial intelligence technology. Investors are bullish on the potential for these advancements to drive future growth.',
    event_type: 'sector_event',
    importance: 4, // Very important
    published_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    price_impact: 0.03, // 3% positive impact
    related_sectors: ['Technology', 'Software']
  },
  {
    id: 'company-event-1',
    headline: 'Company Event: TechCorp Announces Record Quarterly Earnings',
    summary: 'TechCorp has announced record earnings for Q2, exceeding analyst expectations by 15%.',
    body: 'TechCorp has reported record earnings for the second quarter, with revenue up 25% year-over-year and profits exceeding analyst expectations by 15%. The company attributes the strong performance to increased adoption of its cloud services and new product launches.',
    event_type: 'company_event',
    importance: 3, // Important
    published_at: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    price_impact: 0.07, // 7% positive impact
    related_stocks: [1, 2, 5]
  },
  {
    id: 'market-event-2',
    headline: 'Market Event: Trade Tensions Escalate Between Major Economies',
    summary: 'Trade tensions are escalating between major economies, leading to market uncertainty.',
    body: 'Trade tensions between major economies have escalated following the introduction of new tariffs. Markets are reacting with uncertainty as investors assess the potential impact on global trade and economic growth.',
    event_type: 'market_event',
    importance: 4, // Very important
    published_at: new Date(Date.now() - 28800000).toISOString(), // 8 hours ago
    price_impact: -0.03 // 3% negative impact
  },
  {
    id: 'sector-event-2',
    headline: 'Sector Event: Energy Stocks Down on Supply Concerns',
    summary: 'Energy sector stocks are down following reports of increased production and supply concerns.',
    body: 'Energy stocks are trading lower today following reports of increased production from major oil-producing countries. The news has raised concerns about oversupply in the market, putting downward pressure on prices.',
    event_type: 'sector_event',
    importance: 3, // Important
    published_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    price_impact: -0.04, // 4% negative impact
    related_sectors: ['Energy', 'Oil & Gas']
  },
  {
    id: 'company-event-2',
    headline: 'Company Event: Retail Giant Plans Major Expansion',
    summary: 'RetailCorp announces plans to open 50 new stores in the next year.',
    body: 'RetailCorp has announced plans to open 50 new stores in the next year as part of a major expansion strategy. The company expects the expansion to create thousands of new jobs and significantly increase its market presence.',
    event_type: 'company_event',
    importance: 2, // Notable
    published_at: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
    price_impact: 0.02, // 2% positive impact
    related_stocks: [10, 15]
  }
];

// Function to simulate WebSocket news updates
export const simulateNewsUpdate = (callback) => {
  // Create a random news item
  const eventTypes = ['market_event', 'sector_event', 'company_event'];
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  const impact = (Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : -1);
  const importance = Math.ceil(Math.random() * 5);
  
  let newsItem = {
    id: `${eventType}-${Date.now()}`,
    headline: `${eventType === 'market_event' ? 'Market Event' : eventType === 'sector_event' ? 'Sector Event' : 'Company Event'}: Simulated News Update`,
    summary: `This is a simulated ${eventType.replace('_', ' ')} for testing purposes.`,
    body: 'This news item was generated by the simulation utility to test real-time updates in the NewsFeed component.',
    event_type: eventType,
    importance: importance,
    published_at: new Date().toISOString(),
    price_impact: impact
  };
  
  // Add related sectors/stocks for sector and company events
  if (eventType === 'sector_event') {
    newsItem.related_sectors = ['Technology', 'Finance', 'Healthcare'].slice(0, Math.ceil(Math.random() * 3));
  } else if (eventType === 'company_event') {
    newsItem.related_stocks = [1, 2, 3, 4, 5].slice(0, Math.ceil(Math.random() * 3));
  }
  
  // Call the callback with the simulated news item
  callback(newsItem);
};

// Export a function to simulate periodic news updates
export const startNewsSimulation = (addListener) => {
  console.log('Starting news simulation - will generate sample news items');
  
  // Create mock listener for news items
  const mockNewsListener = addListener('news_item', (message) => {
    console.log('Received simulated news item:', message);
  });
  
  // Simulate news updates every 15-30 seconds
  const interval = setInterval(() => {
    simulateNewsUpdate((newsItem) => {
      console.log('Simulating news update:', newsItem);
      
      // Manually trigger all registered listeners
      const event = new CustomEvent('message', {
        detail: {
          data: JSON.stringify({
            type: 'news_item',
            ...newsItem
          })
        }
      });
      
      // Dispatch event to simulate WebSocket message
      window.dispatchEvent(event);
    });
  }, 15000 + Math.random() * 15000); // Random interval between 15-30 seconds
  
  return () => {
    clearInterval(interval);
    mockNewsListener();
  };
};