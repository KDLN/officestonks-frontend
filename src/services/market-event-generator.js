/**
 * Market Event Generator Service
 * 
 * This service continuously generates realistic market events to ensure
 * the news feed always has fresh, interesting content even when disconnected
 * from the backend. It simulates market events, sector events, and company events
 * with a variety of templates and realistic parameters.
 */

import { addListener } from './websocket';

// Import the listeners object from websocket.js
// This is a workaround to directly access the listeners
let listeners = {};
try {
  // This is for development access only
  if (typeof window !== 'undefined') {
    // Wait for websocket.js to initialize
    setTimeout(() => {
      if (window.websocketListeners) {
        listeners = window.websocketListeners;
        console.log('Successfully imported WebSocket listeners');
      } else {
        console.warn('WebSocket listeners not available yet');
      }
    }, 1000);
  }
} catch (e) {
  console.error('Error accessing WebSocket listeners:', e);
}

// ===== DATA SOURCES FOR EVENT GENERATION =====

// Common market event templates
const MARKET_EVENT_TEMPLATES = [
  {
    name: 'Interest Rate Decision',
    templates: [
      { headline: 'Market Event: Federal Reserve Raises Interest Rates by {amount}%', impact: -0.03, importance: 5 },
      { headline: 'Market Event: Federal Reserve Cuts Interest Rates by {amount}%', impact: 0.04, importance: 5 },
      { headline: 'Market Event: Federal Reserve Holds Interest Rates Steady', impact: 0.01, importance: 4 },
      { headline: 'Market Event: Central Bank Signals Future Rate {direction}', impact: '{directionImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const amount = (Math.random() * 0.5 + 0.25).toFixed(2);
      const direction = Math.random() > 0.5 ? 'Hikes' : 'Cuts';
      const directionImpact = direction === 'Hikes' ? -0.02 : 0.02;
      return { 
        amount, 
        direction, 
        directionImpact,
        body: `The Federal Reserve has announced it ${direction === 'Hikes' ? 'will raise' : 'will cut'} interest rates in the coming months. Analysts suggest this signals ${direction === 'Hikes' ? 'concerns about inflation' : 'efforts to stimulate economic growth'}.`
      };
    }
  },
  {
    name: 'Economic Indicators',
    templates: [
      { headline: 'Market Event: GDP Growth {direction} to {value}% for Q{quarter}', impact: '{directionImpact}', importance: 4 },
      { headline: 'Market Event: Unemployment Rate {direction} to {value}%', impact: '{directionImpact}', importance: 4 },
      { headline: 'Market Event: Inflation {direction} to {value}% in Latest Report', impact: '{directionImpact}', importance: 5 },
      { headline: 'Market Event: Consumer Confidence Index {direction} to {value}', impact: '{directionImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const isPositive = Math.random() > 0.4;
      const direction = isPositive ? 'Rises' : 'Falls';
      const directionImpact = isPositive ? 0.02 : -0.02;
      const quarter = Math.ceil(Math.random() * 4);
      
      // Generate appropriate values based on indicator type
      let value;
      if (Math.random() > 0.5) { // GDP or Inflation (lower numbers)
        value = (Math.random() * 4 + 1).toFixed(1);
      } else { // Unemployment or confidence (higher numbers)
        value = (Math.random() * 5 + 3).toFixed(1);
      }
      
      return { direction, directionImpact, value, quarter };
    }
  },
  {
    name: 'Global Events',
    templates: [
      { headline: 'Market Event: Trade Agreement Reached Between Major Economies', impact: 0.03, importance: 4 },
      { headline: 'Market Event: Political Tensions Rise in {region}', impact: -0.03, importance: 3 },
      { headline: 'Market Event: Major Currency Fluctuations Affect Global Markets', impact: -0.02, importance: 4 },
      { headline: 'Market Event: Global Supply Chain Disruptions Reported', impact: -0.025, importance: 3 },
      { headline: 'Market Event: International Monetary Fund Updates Global Growth Forecast', impact: '{randomImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const regions = ['East Asia', 'Europe', 'Middle East', 'South America', 'North America'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const randomImpact = (Math.random() > 0.6) ? 0.02 : -0.02;
      
      return { region, randomImpact };
    }
  },
];

// Sector event templates
const SECTOR_EVENT_TEMPLATES = [
  {
    name: 'Technology Sector',
    sector: 'Technology',
    templates: [
      { headline: 'Sector Event: Tech Stocks {direction} on AI Development News', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: Semiconductor Shortage {status} Tech Manufacturing', impact: '{statusImpact}', importance: 4 },
      { headline: 'Sector Event: Major Data Breach Affects Tech Companies', impact: -0.04, importance: 3 },
      { headline: 'Sector Event: New Technology Regulations Announced', impact: -0.03, importance: 4 },
      { headline: 'Sector Event: Tech Giants Report {earningsDirection} Earnings', impact: '{earningsImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Rally' : 'Slump';
      const directionImpact = direction === 'Rally' ? 0.04 : -0.04;
      
      const status = Math.random() > 0.5 ? 'Eases, Boosting' : 'Continues to Hamper';
      const statusImpact = status.includes('Eases') ? 0.03 : -0.03;
      
      const earningsDirection = Math.random() > 0.5 ? 'Strong' : 'Weak';
      const earningsImpact = earningsDirection === 'Strong' ? 0.05 : -0.05;
      
      return { 
        direction, directionImpact, 
        status, statusImpact,
        earningsDirection, earningsImpact,
        related_sectors: ['Technology', 'Software', 'Hardware']
      };
    }
  },
  {
    name: 'Financial Sector',
    sector: 'Finance',
    templates: [
      { headline: 'Sector Event: Banking Stocks {direction} on Regulatory Changes', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: Financial Sector Faces New Compliance Requirements', impact: -0.02, importance: 3 },
      { headline: 'Sector Event: Investment Banks Report {earningsDirection} Trading Revenue', impact: '{earningsImpact}', importance: 3 },
      { headline: 'Sector Event: Insurance Companies {direction} After Natural Disaster Reports', impact: '{directionImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Rise' : 'Fall';
      const directionImpact = direction === 'Rise' ? 0.03 : -0.03;
      
      const earningsDirection = Math.random() > 0.5 ? 'Stronger-Than-Expected' : 'Lower-Than-Expected';
      const earningsImpact = earningsDirection.includes('Stronger') ? 0.04 : -0.04;
      
      return { 
        direction, directionImpact, 
        earningsDirection, earningsImpact,
        related_sectors: ['Finance', 'Banking', 'Insurance']
      };
    }
  },
  {
    name: 'Energy Sector',
    sector: 'Energy',
    templates: [
      { headline: 'Sector Event: Oil Prices {direction} on Supply {supplyDirection}', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: Renewable Energy Stocks {direction} on Policy Changes', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: Energy Production {direction} in Major Markets', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: New Energy Technology Breakthrough Announced', impact: 0.04, importance: 4 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Surge' : 'Plunge';
      const directionImpact = direction === 'Surge' ? 0.04 : -0.04;
      const supplyDirection = Math.random() > 0.5 ? 'Concerns' : 'Optimism';
      
      return { 
        direction, directionImpact, supplyDirection,
        related_sectors: ['Energy', 'Oil & Gas', 'Utilities']
      };
    }
  },
  {
    name: 'Healthcare Sector',
    sector: 'Healthcare',
    templates: [
      { headline: 'Sector Event: Healthcare Stocks {direction} on Regulatory Announcement', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: Pharmaceutical Companies Report {status} Drug Trial Results', impact: '{statusImpact}', importance: 4 },
      { headline: 'Sector Event: Medical Device Manufacturers {direction} on Innovation News', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: Healthcare Spending {direction} in Latest Economic Data', impact: '{directionImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Rise' : 'Fall';
      const directionImpact = direction === 'Rise' ? 0.03 : -0.03;
      
      const status = Math.random() > 0.5 ? 'Positive' : 'Negative';
      const statusImpact = status === 'Positive' ? 0.05 : -0.05;
      
      return { 
        direction, directionImpact, 
        status, statusImpact,
        related_sectors: ['Healthcare', 'Pharmaceuticals', 'Biotechnology']
      };
    }
  },
];

// Company event templates
const COMPANY_EVENT_TEMPLATES = [
  {
    name: 'Earnings Reports',
    templates: [
      { headline: 'Company Event: {company} Reports {earningsDirection} Quarterly Earnings', impact: '{earningsImpact}', importance: 3 },
      { headline: 'Company Event: {company} {beatsOrMisses} Analyst Expectations', impact: '{beatsOrMissesImpact}', importance: 3 },
      { headline: 'Company Event: {company} Revises {revisionDirection} Future Earnings Guidance', impact: '{revisionImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const companies = [
        { name: 'TechCorp', id: 1 },
        { name: 'MegaBank', id: 2 },
        { name: 'EnergyFuture', id: 3 },
        { name: 'RetailGiant', id: 4 },
        { name: 'HealthInnovate', id: 5 },
        { name: 'GrowthSoftware', id: 6 },
        { name: 'IndustrialPro', id: 7 },
        { name: 'FoodCorp', id: 8 },
      ];
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      const earningsDirection = Math.random() > 0.5 ? 'Better-Than-Expected' : 'Weaker-Than-Expected';
      const earningsImpact = earningsDirection.includes('Better') ? 0.06 : -0.06;
      
      const beatsOrMisses = Math.random() > 0.5 ? 'Beats' : 'Misses';
      const beatsOrMissesImpact = beatsOrMisses === 'Beats' ? 0.07 : -0.07;
      
      const revisionDirection = Math.random() > 0.5 ? 'Upward' : 'Downward';
      const revisionImpact = revisionDirection === 'Upward' ? 0.05 : -0.05;
      
      return { 
        company: company.name,
        earningsDirection, earningsImpact,
        beatsOrMisses, beatsOrMissesImpact,
        revisionDirection, revisionImpact,
        related_stocks: [company.id]
      };
    }
  },
  {
    name: 'Corporate Actions',
    templates: [
      { headline: 'Company Event: {company} Announces {actionType}', impact: '{actionImpact}', importance: 4 },
      { headline: 'Company Event: {company} {direction} Workforce by {percentage}%', impact: '{workforceImpact}', importance: 3 },
      { headline: 'Company Event: {company} Launches New Product Line', impact: 0.04, importance: 3 },
      { headline: 'Company Event: {company} CEO Steps Down, Successor Announced', impact: -0.02, importance: 4 },
    ],
    generateDetails: () => {
      const companies = [
        { name: 'TechCorp', id: 1 },
        { name: 'MegaBank', id: 2 },
        { name: 'EnergyFuture', id: 3 },
        { name: 'RetailGiant', id: 4 },
        { name: 'HealthInnovate', id: 5 },
        { name: 'GrowthSoftware', id: 6 },
        { name: 'IndustrialPro', id: 7 },
        { name: 'FoodCorp', id: 8 },
      ];
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      
      const actionTypes = [
        { type: 'Major Acquisition', impact: 0.05 },
        { type: 'Stock Buyback Program', impact: 0.04 },
        { type: 'Dividend Increase', impact: 0.03 },
        { type: 'Restructuring Plan', impact: -0.02 },
      ];
      const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      
      const direction = Math.random() > 0.7 ? 'Expands' : 'Reduces';
      const percentage = Math.floor(Math.random() * 15) + 5;
      const workforceImpact = direction === 'Expands' ? 0.02 : -0.03;
      
      return { 
        company: company.name,
        actionType: action.type, 
        actionImpact: action.impact,
        direction, percentage, workforceImpact,
        related_stocks: [company.id]
      };
    }
  },
];

// ===== EVENT GENERATION FUNCTIONS =====

/**
 * Selects a template and generates event details
 * @param {object} templateGroup - Group of templates to choose from
 * @returns {object} - Generated event details
 */
const generateEventFromTemplate = (templateGroup) => {
  // Select a random template from the group
  const template = templateGroup.templates[Math.floor(Math.random() * templateGroup.templates.length)];
  
  // Generate variable details for this template
  const details = templateGroup.generateDetails();
  
  // Replace template placeholders with actual values
  let headline = template.headline;
  let impact = template.impact;
  
  // Replace placeholders in headline
  for (const [key, value] of Object.entries(details)) {
    headline = headline.replace(`{${key}}`, value);
    
    // If impact contains a placeholder, replace it
    if (typeof impact === 'string' && impact.includes(`{${key}}`)) {
      impact = value;
    }
  }
  
  // Create summary and body based on the headline
  const summary = headline.replace(/(Market|Sector|Company) Event: /, '');
  const body = details.body || `${summary}. This event may affect related ${templateGroup.sector ? 'companies in the ' + templateGroup.sector + ' sector' : 'markets'}.`;
  
  return {
    headline,
    summary,
    body,
    importance: template.importance,
    price_impact: Number(impact),
    ...details
  };
};

/**
 * Generates a market event
 * @returns {object} - Generated market event
 */
export const generateMarketEvent = () => {
  const templateGroup = MARKET_EVENT_TEMPLATES[Math.floor(Math.random() * MARKET_EVENT_TEMPLATES.length)];
  const eventDetails = generateEventFromTemplate(templateGroup);
  
  return {
    id: `market-event-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    event_type: 'market_event',
    published_at: new Date(),
    ...eventDetails
  };
};

/**
 * Generates a sector event
 * @returns {object} - Generated sector event
 */
export const generateSectorEvent = () => {
  const templateGroup = SECTOR_EVENT_TEMPLATES[Math.floor(Math.random() * SECTOR_EVENT_TEMPLATES.length)];
  const eventDetails = generateEventFromTemplate(templateGroup);
  
  return {
    id: `sector-event-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    event_type: 'sector_event',
    published_at: new Date(),
    ...eventDetails
  };
};

/**
 * Generates a company event
 * @returns {object} - Generated company event
 */
export const generateCompanyEvent = () => {
  const templateGroup = COMPANY_EVENT_TEMPLATES[Math.floor(Math.random() * COMPANY_EVENT_TEMPLATES.length)];
  const eventDetails = generateEventFromTemplate(templateGroup);
  
  return {
    id: `company-event-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    event_type: 'company_event',
    published_at: new Date(),
    ...eventDetails
  };
};

/**
 * Generates a random event of any type
 * @returns {object} - Generated event
 */
export const generateRandomEvent = () => {
  const eventType = Math.random();
  
  if (eventType < 0.3) {
    return generateMarketEvent();
  } else if (eventType < 0.6) {
    return generateSectorEvent();
  } else {
    return generateCompanyEvent();
  }
};

// ===== EVENT SCHEDULER FUNCTIONS =====

let eventGeneratorInterval = null;
let eventFrequency = 10000; // Default: 10 seconds
let maxEventFrequency = 30000; // Maximum: 30 seconds
let minImpactPercentage = 1; // Minimum impact: 1%
let maxImpactPercentage = 7; // Maximum impact: 7%
let isGenerating = false;

/**
 * Starts the event generator with a specified frequency range
 * @param {number} minFrequency - Minimum milliseconds between events (default: 10000)
 * @param {number} maxFrequency - Maximum milliseconds between events (default: 30000)
 * @param {function} callback - Optional callback for each generated event
 * @returns {function} - Function to stop the generator
 */
export const startEventGenerator = (minFrequency = 10000, maxFrequency = 30000, callback = null) => {
  if (isGenerating) {
    stopEventGenerator();
  }
  
  eventFrequency = minFrequency;
  maxEventFrequency = maxFrequency;
  isGenerating = true;
  console.log(`Starting market event generator with ${minFrequency/1000}-${maxFrequency/1000} second frequency range`);
  
  // Function to generate an event with guaranteed price impact
  const generateEventWithImpact = () => {
    // Generate a random event
    let event = generateRandomEvent();
    
    // Get impact settings from local storage if available
    const storedMinImpact = localStorage.getItem('eventMinImpact');
    const storedMaxImpact = localStorage.getItem('eventMaxImpact');
    
    if (storedMinImpact) minImpactPercentage = Number(storedMinImpact);
    if (storedMaxImpact) maxImpactPercentage = Number(storedMaxImpact);
    
    // Convert percentages to decimal values
    const minImpact = minImpactPercentage / 100;
    const maxImpact = maxImpactPercentage / 100;
    
    // Ensure the event has a meaningful price impact (within configured range)
    if (Math.abs(event.price_impact) < minImpact || Math.random() > 0.7) {
      // Generate random impact within the configured range
      const impactSize = minImpact + Math.random() * (maxImpact - minImpact);
      const impact = impactSize * (Math.random() > 0.5 ? 1 : -1);
      
      event.price_impact = impact;
      console.log(`Adjusted price impact to ${(impact * 100).toFixed(2)}% to ensure market effect (range: ${minImpactPercentage}%-${maxImpactPercentage}%)`);
    }
    
    return event;
  };
  
  // Function to generate and dispatch an event
  const generateAndDispatchEvent = () => {
    // Generate event with guaranteed impact
    const event = generateEventWithImpact();
    console.log('Generated market event:', event);
    console.log(`Price impact: ${(event.price_impact * 100).toFixed(2)}%`);
    
    // Call the callback if provided
    if (callback) {
      callback(event);
    }
    
    // Dispatch as a WebSocket-like message
    dispatchWebSocketEvent(event);
    
    // Schedule next event with random timing within the range
    scheduleNextEvent();
    
    return event;
  };
  
  // Function to schedule the next event
  const scheduleNextEvent = () => {
    // Clear any existing interval
    if (eventGeneratorInterval) {
      clearTimeout(eventGeneratorInterval);
    }
    
    // Calculate random delay between min and max frequency
    const randomDelay = minFrequency + Math.random() * (maxFrequency - minFrequency);
    console.log(`Next event scheduled in ${(randomDelay/1000).toFixed(1)} seconds`);
    
    // Schedule the next event
    eventGeneratorInterval = setTimeout(generateAndDispatchEvent, randomDelay);
  };
  
  // Generate one event immediately
  generateAndDispatchEvent();
  
  // Return function to stop the generator
  return stopEventGenerator;
};

/**
 * Stops the event generator
 */
export const stopEventGenerator = () => {
  if (eventGeneratorInterval) {
    clearInterval(eventGeneratorInterval);
    eventGeneratorInterval = null;
    isGenerating = false;
    console.log('Stopped market event generator');
  }
};

/**
 * Dispatches a WebSocket-like event for a market event
 * @param {object} event - The event to dispatch
 */
const dispatchWebSocketEvent = (event) => {
  // Determine the appropriate event type based on the event
  const wsEventType = event.event_type || 'news_item';
  
  // Create the event payload
  const eventData = {
    type: wsEventType,
    ...event
  };
  
  console.log('Dispatching market event:', eventData);
  
  // METHOD 1: Create a CustomEvent that mimics a WebSocket message
  const wsEvent = new CustomEvent('message', {
    detail: {
      data: JSON.stringify(eventData)
    }
  });
  
  // Dispatch the event to window so WebSocket listeners can catch it
  window.dispatchEvent(wsEvent);
  
  // METHOD 2: Directly call any registered listeners for this message type
  try {
    // Access listeners from window or the imported object
    const availableListeners = window.websocketListeners || listeners || {};
    
    // Call type-specific listeners
    if (availableListeners[wsEventType] && availableListeners[wsEventType].length > 0) {
      console.log(`Calling ${availableListeners[wsEventType].length} listeners for type ${wsEventType}`);
      availableListeners[wsEventType].forEach(callback => {
        try {
          callback(eventData);
        } catch (err) {
          console.error(`Error in ${wsEventType} listener:`, err);
        }
      });
    } else {
      console.log(`No listeners found for type ${wsEventType}`);
    }
    
    // Call wildcard listeners
    if (availableListeners['*'] && availableListeners['*'].length > 0) {
      console.log(`Calling ${availableListeners['*'].length} wildcard listeners`);
      availableListeners['*'].forEach(callback => {
        try {
          callback(eventData);
        } catch (err) {
          console.error('Error in wildcard listener:', err);
        }
      });
    }
  } catch (e) {
    console.error('Error dispatching directly to listeners:', e);
  }
  
  // METHOD 3: Try to simulate a socket message event 
  if (window.socket) {
    try {
      const simulatedEvent = { 
        data: JSON.stringify(eventData)
      };
      
      // Check if socket has eventListeners property
      if (typeof window.socket.dispatchEvent === 'function') {
        const messageEvent = new MessageEvent('message', simulatedEvent);
        window.socket.dispatchEvent(messageEvent);
      } else {
        console.log('Socket doesn\'t have dispatchEvent method, trying manual dispatch');
      }
    } catch (e) {
      console.error('Error simulating WebSocket message event:', e);
    }
  }
};

/**
 * Changes the frequency range of event generation
 * @param {number} minFrequency - Minimum frequency in milliseconds
 * @param {number} maxFrequency - Maximum frequency in milliseconds
 */
export const setEventFrequencyRange = (minFrequency, maxFrequency) => {
  if (minFrequency > maxFrequency) {
    // Swap if min is greater than max
    [minFrequency, maxFrequency] = [maxFrequency, minFrequency];
  }
  
  if (isGenerating) {
    stopEventGenerator();
    startEventGenerator(minFrequency, maxFrequency);
  } else {
    eventFrequency = minFrequency;
    maxEventFrequency = maxFrequency;
  }
  console.log(`Event frequency range set to ${minFrequency/1000}-${maxEventFrequency/1000} seconds`);
};

/**
 * Sets the event price impact range
 * @param {number} minImpact - Minimum impact percentage (1-15)
 * @param {number} maxImpact - Maximum impact percentage (1-15)
 */
export const setEventImpactRange = (minImpact, maxImpact) => {
  if (minImpact > maxImpact) {
    // Swap if min is greater than max
    [minImpact, maxImpact] = [maxImpact, minImpact];
  }
  
  // Ensure reasonable bounds
  minImpact = Math.max(0.1, Math.min(15, minImpact));
  maxImpact = Math.max(minImpact, Math.min(15, maxImpact));
  
  minImpactPercentage = minImpact;
  maxImpactPercentage = maxImpact;
  
  console.log(`Event impact range set to ${minImpactPercentage}%-${maxImpactPercentage}%`);
};

// Auto-start the generator when this module is imported
// Use a small delay to ensure all listeners are set up first
setTimeout(() => {
  // Start with default 10-30 second range
  startEventGenerator(10000, 30000);
}, 5000);