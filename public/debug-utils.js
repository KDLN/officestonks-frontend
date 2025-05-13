/**
 * Debug utilities for OfficeStonks
 * Provides browser console functions to diagnose CORS and API issues
 */

console.log('OfficeStonks debug utilities loaded');

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
`);

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
    results.innerHTML = 'Testing all news methods...<br>';
    
    try {
      // Add public proxy test
      results.innerHTML += 'Testing public proxy...<br>';
      
      try {
        const proxyUrl = 'https://corsproxy.io/?';
        const targetUrl = 'https://officestonks-backend-production.up.railway.app/api/news?limit=5';
        const encodedUrl = encodeURIComponent(targetUrl);
        
        const response = await fetch(`${proxyUrl}${encodedUrl}`, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          const data = await response.json();
          results.innerHTML += `✅ Public proxy success: ${data.length} items<br>`;
        } else {
          results.innerHTML += `❌ Public proxy failed: ${response.status}<br>`;
        }
      } catch (error) {
        results.innerHTML += `❌ Public proxy error: ${error.message}<br>`;
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