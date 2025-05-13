/**
 * CORS Debug Script
 * This script will test CORS connectivity to various endpoints to help diagnose issues
 */

(function() {
  console.log('CORS Debug script running');

  // Create debug container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.bottom = '10px';
  container.style.left = '10px';
  container.style.width = '300px';
  container.style.maxHeight = '500px';
  container.style.overflow = 'auto';
  container.style.background = 'rgba(0, 0, 0, 0.8)';
  container.style.color = 'white';
  container.style.padding = '10px';
  container.style.fontSize = '10px';
  container.style.fontFamily = 'monospace';
  container.style.zIndex = '9999';
  container.style.borderRadius = '5px';
  container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  
  // Add title
  const title = document.createElement('div');
  title.textContent = 'CORS Debug Tool';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  title.style.fontSize = '12px';
  container.appendChild(title);
  
  // Add status area
  const statusArea = document.createElement('div');
  statusArea.id = 'debug-status';
  container.appendChild(statusArea);
  
  // Add to document
  document.body.appendChild(container);

  // Helper to add log entries
  function log(message, success = true) {
    const entry = document.createElement('div');
    entry.style.borderLeft = success ? '3px solid #4caf50' : '3px solid #f44336';
    entry.style.padding = '5px';
    entry.style.marginBottom = '5px';
    entry.textContent = message;
    statusArea.appendChild(entry);
    console.log(message);
    
    // Scroll to bottom
    statusArea.scrollTop = statusArea.scrollHeight;
  }

  // Run tests in sequence
  async function runTests() {
    log('Starting API connectivity tests...', true);
    
    // Get current hostname
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const origin = window.location.origin;
    
    // Determine API base URL
    let backendUrl = 'https://officestonks-backend-production.up.railway.app';
    let proxyUrl = 'https://officestonks-proxy-production.up.railway.app';
    
    // Log configuration
    log(`Origin: ${origin}`, true);
    log(`Backend URL: ${backendUrl}`, true);
    log(`Proxy URL: ${proxyUrl}`, true);
    
    // Test direct health endpoint
    try {
      log('Testing direct /health endpoint...', true);
      const response = await fetch(`${proxyUrl}/health`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        log(`✅ Direct health check OK: ${JSON.stringify(data)}`, true);
      } else {
        log(`❌ Direct health check failed: ${response.status} ${response.statusText}`, false);
      }
    } catch (error) {
      log(`❌ Direct health check error: ${error.message}`, false);
    }

    // Test API health endpoint
    try {
      log('Testing API /api/health endpoint...', true);
      const response = await fetch(`${proxyUrl}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        log(`✅ API health check OK: ${JSON.stringify(data)}`, true);
      } else {
        log(`❌ API health check failed: ${response.status} ${response.statusText}`, false);
      }
    } catch (error) {
      log(`❌ API health check error: ${error.message}`, false);
    }

    // Test direct health debug endpoint
    try {
      log('Testing direct health debug endpoint...', true);
      const response = await fetch(`${proxyUrl}/api/health-direct`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        log(`✅ Direct debug health check OK: ${JSON.stringify(data)}`, true);
      } else {
        log(`❌ Direct debug health check failed: ${response.status} ${response.statusText}`, false);
      }
    } catch (error) {
      log(`❌ Direct debug health check error: ${error.message}`, false);
    }

    // Test news endpoint
    try {
      log('Testing news endpoint...', true);
      const response = await fetch(`${proxyUrl}/api/news?limit=1&offset=0`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const itemCount = Array.isArray(data) ? data.length : 'not an array';
        log(`✅ News endpoint OK: ${itemCount} items`, true);
      } else {
        log(`❌ News endpoint failed: ${response.status} ${response.statusText}`, false);
      }
    } catch (error) {
      log(`❌ News endpoint error: ${error.message}`, false);
    }

    log('Tests complete', true);
  }

  // Start tests when page has loaded
  if (document.readyState === 'complete') {
    runTests();
  } else {
    window.addEventListener('load', runTests);
  }
})();