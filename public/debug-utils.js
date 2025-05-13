/**
 * Debug utilities for OfficeStonks
 * Provides browser console functions to diagnose CORS and API issues
 */

console.log('OfficeStonks debug utilities loaded');

// EMERGENCY FIX for tabs if they don't work - run window.OfficeStonksDebug.fixTabs() in console
let tabFixApplied = false;

// Add utilities to window object
window.OfficeStonksDebug = {
  // Test CORS with a specific endpoint
  testCors: async (endpoint) => {
    const url = endpoint || 'https://officestonks-backend-production.up.railway.app/api/health';
    console.log(`Testing CORS for: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ CORS request succeeded:', data);
        return data;
      } else {
        console.error(`❌ CORS request failed: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('❌ CORS request error:', error);
      return null;
    }
  },
  
  // Test public proxy
  testPublicProxy: async (targetUrl) => {
    const url = targetUrl || 'https://officestonks-backend-production.up.railway.app/api/health';
    const proxyUrl = 'https://corsproxy.io/?';
    const encodedUrl = encodeURIComponent(url);
    
    console.log(`Testing public proxy for: ${url}`);
    console.log(`Proxy URL: ${proxyUrl}${encodedUrl}`);
    
    try {
      const response = await fetch(`${proxyUrl}${encodedUrl}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Public proxy request succeeded:', data);
        return data;
      } else {
        console.error(`❌ Public proxy request failed: ${response.status} ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error('❌ Public proxy request error:', error);
      return null;
    }
  },
  
  // Test all stock service endpoints
  testStockService: async () => {
    console.log('Testing stock service endpoints...');
    
    // Define list of endpoints to test
    const endpoints = [
      { name: 'Portfolio', url: 'https://officestonks-backend-production.up.railway.app/api/portfolio' },
      { name: 'Stocks', url: 'https://officestonks-backend-production.up.railway.app/api/stocks' },
      { name: 'Transactions', url: 'https://officestonks-backend-production.up.railway.app/api/transactions?limit=5' }
    ];
    
    // Try each endpoint using public proxy
    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.name} via public proxy...`);
      
      try {
        const proxyUrl = 'https://corsproxy.io/?';
        const encodedUrl = encodeURIComponent(endpoint.url);
        const response = await fetch(`${proxyUrl}${encodedUrl}`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name} fetch successful via public proxy:`, data);
        } else {
          console.error(`❌ ${endpoint.name} fetch failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ ${endpoint.name} fetch error:`, error);
      }
    }
    
    console.log('Stock service endpoints testing complete');
  },
  
  // Try all possible ways to access news
  testAllNewsMethods: async () => {
    console.log('Testing all news access methods...');
    
    // Define test URLs
    const urls = {
      direct: 'https://officestonks-backend-production.up.railway.app/api/news?limit=5',
      proxy: 'https://officestonks-proxy-production.up.railway.app/api/news?limit=5',
      publicProxy: 'https://corsproxy.io/?' + encodeURIComponent('https://officestonks-backend-production.up.railway.app/api/news?limit=5')
    };
    
    // Test each URL
    for (const [name, url] of Object.entries(urls)) {
      console.log(`Testing ${name} URL: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${name} request succeeded:`, data);
        } else {
          console.error(`❌ ${name} request failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`❌ ${name} request error:`, error);
      }
    }
    
    console.log('All news methods tested');
  }
};

// Add instructions for using debug utilities
console.log(`
OfficeStonks Debug Utilities:
- window.OfficeStonksDebug.testCors(url) - Test CORS for a specific URL
- window.OfficeStonksDebug.testPublicProxy(url) - Test public proxy for a URL
- window.OfficeStonksDebug.testAllNewsMethods() - Test all possible ways to access news API
- window.OfficeStonksDebug.testStockService() - Test all stock service endpoints
- window.OfficeStonksDebug.fixTabs() - Fix tab visibility and switching (RUN THIS IF TABS DON'T WORK)
`);

  // Fix tab switching functionality if broken
  fixTabs: () => {
    if (tabFixApplied) {
      console.log('Tab fix already applied');
      return;
    }
    
    console.log('Applying emergency tab fix...');
    
    // Find tab buttons
    const portfolioTabButton = document.getElementById('portfolio-tab-button') || 
                             document.querySelector('.dashboard-tabs .tab-button:first-child');
                             
    const newsTabButton = document.getElementById('news-tab-button') || 
                        document.querySelector('.dashboard-tabs .tab-button:nth-child(2)');
    
    // Find content divs
    const portfolioContent = document.querySelector('.dashboard-content:not(.news-tab-content)');
    const newsContent = document.querySelector('.dashboard-content.news-tab-content');
    
    if (!portfolioTabButton || !newsTabButton) {
      console.error('Could not find tab buttons');
      return;
    }
    
    if (!portfolioContent || !newsContent) {
      console.error('Could not find content divs');
      return;
    }
    
    console.log('Tab elements found, setting up direct click handlers');
    
    // Override CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* Remove any forced styles */
      .news-tab-content { display: block; }
      .dashboard-content:not(.news-tab-content) { display: block; }
    `;
    document.head.appendChild(styleEl);
    
    // Set up portfolio tab
    portfolioTabButton.addEventListener('click', function() {
      console.log('Portfolio tab clicked (emergency handler)');
      
      // Update button styles
      portfolioTabButton.classList.add('active');
      newsTabButton.classList.remove('active');
      
      // Show/hide content
      portfolioContent.style.display = 'block';
      newsContent.style.display = 'none';
    });
    
    // Set up news tab
    newsTabButton.addEventListener('click', function() {
      console.log('News tab clicked (emergency handler)');
      
      // Update button styles
      newsTabButton.classList.add('active');
      portfolioTabButton.classList.remove('active');
      
      // Show/hide content
      newsContent.style.display = 'block';
      portfolioContent.style.display = 'none';
    });
    
    console.log('Tab fix applied - try clicking tabs now');
    tabFixApplied = true;
  },

// Add script element for the debug interface
const addDebugInterface = () => {
  // Create container
  const container = document.createElement('div');
  container.id = 'debug-container';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = '9999';
  container.style.background = 'rgba(0, 0, 0, 0.7)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.borderRadius = '5px';
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '12px';
  container.style.maxWidth = '250px';
  container.style.maxHeight = '400px';
  container.style.overflow = 'auto';
  
  // Create button
  const button = document.createElement('button');
  button.textContent = 'Test News API';
  button.style.width = '100%';
  button.style.padding = '5px';
  button.style.marginBottom = '10px';
  button.style.background = '#1976d2';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '3px';
  button.style.cursor = 'pointer';
  
  // Create results container
  const results = document.createElement('div');
  results.id = 'debug-results';
  
  // Add click handler
  button.addEventListener('click', async () => {
    results.innerHTML = 'Testing all endpoints...<br>';
    
    // Add button for tab fix
    const fixButton = document.createElement('button');
    fixButton.textContent = 'Fix Tab Switching';
    fixButton.style.marginTop = '10px';
    fixButton.style.backgroundColor = '#f44336';
    fixButton.style.padding = '5px';
    fixButton.style.width = '100%';
    fixButton.style.border = 'none';
    fixButton.style.borderRadius = '3px';
    fixButton.style.color = 'white';
    fixButton.style.cursor = 'pointer';
    
    // Add fix button after results
    results.parentNode.insertBefore(fixButton, results.nextSibling);
    
    // Add click handler
    fixButton.addEventListener('click', () => {
      window.OfficeStonksDebug.fixTabs();
      results.innerHTML += 'Tab fix applied. Try clicking tabs now.<br>';
    });
    
    try {
      // Add endpoints test
      const endpoints = [
        { name: 'Health', url: 'health' },
        { name: 'News', url: 'news?limit=5' },
        { name: 'Portfolio', url: 'portfolio' },
        { name: 'Stocks', url: 'stocks' }
      ];
      
      for (const endpoint of endpoints) {
        results.innerHTML += `Testing ${endpoint.name}...<br>`;
        
        try {
          const proxyUrl = 'https://corsproxy.io/?';
          const targetUrl = `https://officestonks-backend-production.up.railway.app/api/${endpoint.url}`;
          const encodedUrl = encodeURIComponent(targetUrl);
          
          const response = await fetch(`${proxyUrl}${encodedUrl}`, {
            method: 'GET',
            mode: 'cors'
          });
          
          if (response.ok) {
            const data = await response.json();
            const count = Array.isArray(data) ? data.length : 'object';
            results.innerHTML += `✅ ${endpoint.name} success: ${count} items<br>`;
          } else {
            results.innerHTML += `❌ ${endpoint.name} failed: ${response.status}<br>`;
          }
        } catch (error) {
          results.innerHTML += `❌ ${endpoint.name} error: ${error.message}<br>`;
        }
      }
    } catch (error) {
      results.innerHTML += `Error during tests: ${error.message}<br>`;
    }
  });
  
  // Assemble and add to page
  container.appendChild(button);
  container.appendChild(results);
  document.body.appendChild(container);
};

// Add debug interface when page loads
if (document.readyState === 'complete') {
  addDebugInterface();
} else {
  window.addEventListener('load', addDebugInterface);
}