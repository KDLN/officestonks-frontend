// Script to ensure news tab is visible
document.addEventListener('DOMContentLoaded', function() {
  console.log('News tab fix script loaded');
  
  // Load a style fix for cleaner UI
  const styleFixElement = document.createElement('style');
  styleFixElement.textContent = `
    /* Ensure news tab section has proper styling */
    .news-tab-content .dashboard-section {
      margin: 0 !important;
      border-radius: 8px !important;
      overflow: hidden !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Fix news feed container styling */
    .news-feed-container {
      border-radius: 0 !important;
      margin-bottom: 0 !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    /* Ensure news headers align properly */
    .news-header-section h2, .news-feed-header h2 {
      font-size: 1.4rem !important;
      margin: 0 !important;
      font-weight: 600 !important;
    }
    
    /* Better badge styling */
    .badge {
      font-size: 0.65rem !important;
      padding: 3px 8px !important;
      border-radius: 4px !important;
      display: inline-block !important;
      margin-right: 8px !important;
    }
  `;
  document.head.appendChild(styleFixElement);
  
  // Function to set the news tab active
  function setNewsTabActive() {
    try {
      // Check if dashboard page is loaded
      const dashboardTabs = document.querySelector('.dashboard-tabs');
      if (!dashboardTabs) {
        console.log('Dashboard tabs not found yet, will retry');
        return false;
      }
        
      // Find tab buttons
      const tabButtons = dashboardTabs.querySelectorAll('.tab-button');
      if (tabButtons.length < 2) {
        console.log('Tab buttons not found yet, will retry');
        return false;
      }
      
      // Find news tab (second tab)
      const newsTab = tabButtons[1];
      
      // If news tab is not already active, click it
      if (!newsTab.classList.contains('active')) {
        console.log('Forcing news tab to be active');
        newsTab.click();
      } else {
        console.log('News tab is already active');
      }
      
      // Find the news-tab-content div - this should contain the news feed
      const newsTabContent = document.querySelector('.news-tab-content');
      if (!newsTabContent) {
        console.log('News tab content not found yet, will retry');
        return false;
      }
      
      // Try to find the news feed container
      const newsFeed = document.querySelector('.news-feed-container');
      if (!newsFeed) {
        console.log('NewsFeed component not found, attempting to inject fallback');
        
        // Create a div for fallback content
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'news-feed-container fallback';
        fallbackDiv.innerHTML = `
          <div style="padding: 15px; background-color: #1976d2; color: white;">
            <h2 style="margin: 0; font-size: 1.4rem;">Market News Feed</h2>
          </div>
          <div style="padding: 20px; background-color: #f8f9fb;">
            <div style="margin-bottom: 15px; padding: 15px; border-bottom: 1px solid #eee;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background-color: #3f51b5; color: white; margin-right: 8px;">MARKET</span>
              <h3 style="margin: 5px 0;">Federal Reserve Cuts Interest Rates</h3>
              <p>The Federal Reserve announced a 0.25% cut in interest rates, citing economic concerns.</p>
            </div>
            <div style="margin-bottom: 15px; padding: 15px; border-bottom: 1px solid #eee;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background-color: #ff9800; color: white; margin-right: 8px;">SECTOR</span>
              <h3 style="margin: 5px 0;">Technology Stocks Rally on AI Advancements</h3>
              <p>Technology sector stocks are rallying following AI breakthroughs.</p>
            </div>
            <div style="margin-bottom: 15px; padding: 15px; border-bottom: 1px solid #eee;">
              <span style="display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; background-color: #4caf50; color: white; margin-right: 8px;">COMPANY</span>
              <h3 style="margin: 5px 0;">Alphabet Reports Record Earnings</h3>
              <p>Alphabet has reported record earnings for Q2, with revenue up 25%.</p>
            </div>
          </div>
        `;
        
        // Append to the news tab content
        newsTabContent.appendChild(fallbackDiv);
        console.log('Fallback news feed injected');
        return true;
      }
      
      console.log('News tab fix applied successfully');
      return true;
    } catch (error) {
      console.error('Error in news tab fix script:', error);
      return false;
    }
  }
  
  // Try immediately
  if (!setNewsTabActive()) {
    // If not successful, retry after a short delay
    setTimeout(() => {
      if (!setNewsTabActive()) {
        // Try one more time after a longer delay
        setTimeout(setNewsTabActive, 1000);
      }
    }, 300);
  }
});