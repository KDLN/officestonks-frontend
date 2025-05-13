#!/usr/bin/env node

/**
 * CORS Proxy Test Script
 * 
 * This script tests the CORS proxy configuration by sending different types of requests
 * and validating the CORS headers in the responses.
 * 
 * Usage:
 *   node test-cors-proxy.js [proxy-url]
 * 
 * Where:
 *   proxy-url: Optional URL to test (defaults to http://localhost:3000)
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Default proxy URL (can be overridden by command line argument)
const proxyUrl = process.argv[2] || 'http://localhost:3000';

console.log(`\n🧪 Testing CORS Proxy at: ${proxyUrl}\n`);

// Test cases to run
const tests = [
  {
    name: 'Health Check',
    path: '/health',
    method: 'GET',
    headers: {
      'Origin': 'https://officestonks-frontend-production.up.railway.app'
    }
  },
  {
    name: 'OPTIONS Preflight Request',
    path: '/api/admin/users',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://officestonks-frontend-production.up.railway.app',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization,Content-Type'
    }
  },
  {
    name: 'OPTIONS Preflight with Unknown Origin',
    path: '/api/admin/users',
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://unknown-origin.example.com',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization,Content-Type'
    }
  },
  {
    name: 'Simple GET Request',
    path: '/api/admin/users',
    method: 'GET',
    headers: {
      'Origin': 'https://officestonks-frontend-production.up.railway.app'
    }
  }
];

// Run tests sequentially
async function runTests() {
  for (const test of tests) {
    console.log(`Running test: ${test.name}`);
    await runTest(test);
    console.log('-'.repeat(80) + '\n');
  }
}

// Run a single test
async function runTest(test) {
  const parsedUrl = url.parse(proxyUrl);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: test.path,
      method: test.method,
      headers: test.headers
    };
    
    console.log(`${test.method} ${proxyUrl}${test.path}`);
    console.log('Headers:', JSON.stringify(test.headers, null, 2));
    
    const req = client.request(options, (res) => {
      console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);
      console.log('Response headers:');
      
      // Check for important CORS headers
      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials',
        'access-control-max-age',
        'vary'
      ];
      
      corsHeaders.forEach(header => {
        if (res.headers[header]) {
          console.log(`  ✅ ${header}: ${res.headers[header]}`);
        } else {
          console.log(`  ❌ ${header}: Missing`);
        }
      });
      
      // Print other headers
      Object.keys(res.headers).forEach(header => {
        if (!corsHeaders.includes(header.toLowerCase())) {
          console.log(`  ${header}: ${res.headers[header]}`);
        }
      });
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          if (body.trim()) {
            const parsedBody = JSON.parse(body);
            console.log('Response body:', JSON.stringify(parsedBody, null, 2));
          }
        } catch (e) {
          if (body.trim()) {
            console.log('Response body (not JSON):', body);
          }
        }
        
        // Test evaluation
        let passed = true;
        
        if (test.method === 'OPTIONS') {
          if (res.statusCode !== 204) {
            console.log('❌ Test failed: OPTIONS request should return 204 No Content');
            passed = false;
          }
          
          if (!res.headers['access-control-allow-origin']) {
            console.log('❌ Test failed: Missing Access-Control-Allow-Origin header');
            passed = false;
          }
          
          if (!res.headers['access-control-allow-credentials']) {
            console.log('❌ Test failed: Missing Access-Control-Allow-Credentials header');
            passed = false;
          }
          
          if (res.headers['access-control-allow-origin'] === '*' && 
              res.headers['access-control-allow-credentials'] === 'true') {
            console.log('❌ Test failed: Cannot use Access-Control-Allow-Origin: * with credentials:true');
            passed = false;
          }
        }
        
        if (passed) {
          console.log('✅ Test passed!');
        }
        
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      resolve();
    });
    
    req.end();
  });
}

runTests().catch(console.error);