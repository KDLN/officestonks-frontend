/**
 * Market Event Generator Service
 * 
 * This service continuously generates realistic market events to ensure
 * the news feed always has fresh, interesting content even when disconnected
 * from the backend. It simulates market events, sector events, and company events
 * with a variety of templates and realistic parameters.
 */

import { addListener } from './websocket';
import { updateStocksFromEvent, getAllStocks } from './stock';

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

// Cache for all stocks to avoid too many API calls
let cachedStocks = null;

// ===== DATA SOURCES FOR EVENT GENERATION =====

// Common market event templates
const MARKET_EVENT_TEMPLATES = [
  {
    name: 'Central Bank Actions',
    templates: [
      { headline: 'Market Event: {centralBank} Raises Interest Rates by {basisPoints} Basis Points to Combat {inflationRate}% Inflation', impact: -0.04, importance: 5 },
      { headline: 'Market Event: {centralBank} Cuts Interest Rates by {basisPoints} Basis Points, Citing {economicConcern}', impact: 0.05, importance: 5 },
      { headline: 'Market Event: {centralBank} {holdAction} Interest Rates at {currentRate}%, {forwardGuidance}', impact: '{holdImpact}', importance: 4 },
      { headline: 'Market Event: {centralBankChair} Signals {monetaryDirection} in {policyTool} During {eventName} Speech', impact: '{directionImpact}', importance: 5 },
      { headline: 'Market Event: Central Banks Coordinate on {coordAction} to Address {globalIssue}', impact: '{coordImpact}', importance: 5 },
      { headline: 'Market Event: {centralBank} Adjusts {facilityName} by ${adjustAmount}B, {marketReaction} Markets', impact: '{adjustImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const centralBanks = ['Federal Reserve', 'European Central Bank', 'Bank of England', 'Bank of Japan', 'People\'s Bank of China', 'Swiss National Bank', 'Reserve Bank of Australia'];
      const centralBank = centralBanks[Math.floor(Math.random() * centralBanks.length)];
      
      const centralBankChairs = ['Fed Chair Powell', 'ECB President Lagarde', 'BoE Governor Bailey', 'BoJ Governor Ueda', 'PBOC Governor Pan', 'SNB Chairman Jordan'];
      const centralBankChair = centralBankChairs[Math.floor(Math.random() * centralBankChairs.length)];
      
      const basisPoints = Math.floor(Math.random() * 50 + 25);
      const inflationRate = (Math.random() * 5 + 2).toFixed(1);
      
      const economicConcerns = ['Economic Slowdown', 'Declining Growth Indicators', 'Employment Concerns', 'Recession Risks', 'Weak Consumer Spending', 'Manufacturing Contraction'];
      const economicConcern = economicConcerns[Math.floor(Math.random() * economicConcerns.length)];
      
      const holdActions = ['Maintains', 'Holds', 'Keeps', 'Leaves Unchanged'];
      const holdAction = holdActions[Math.floor(Math.random() * holdActions.length)];
      
      const currentRate = (Math.random() * 4.5 + 1).toFixed(2);
      
      const forwardGuidances = ['Signaling Extended Pause', 'Leaving Door Open for Future Cuts', 'Hinting at Possible Hikes', 'Maintaining Data-Dependent Approach', 'Revising Growth Outlook'];
      const forwardGuidance = forwardGuidances[Math.floor(Math.random() * forwardGuidances.length)];
      
      const holdImpact = forwardGuidance.includes('Cuts') ? 0.02 : (forwardGuidance.includes('Hikes') ? -0.02 : (Math.random() > 0.5 ? 0.01 : -0.01));
      
      const monetaryDirections = ['Hawkish Shift', 'Dovish Pivot', 'Tightening Bias', 'Easing Cycle', 'Neutral Stance', 'Policy Normalization'];
      const monetaryDirection = monetaryDirections[Math.floor(Math.random() * monetaryDirections.length)];
      
      const directionImpact = monetaryDirection.includes('Hawkish') || monetaryDirection.includes('Tightening') ? 
        -0.03 - Math.random() * 0.02 : monetaryDirection.includes('Dovish') || monetaryDirection.includes('Easing') ? 
        0.03 + Math.random() * 0.02 : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      const policyTools = ['Forward Guidance', 'Balance Sheet Policy', 'Reserve Requirements', 'Open Market Operations', 'Lending Facilities', 'Quantitative Measures'];
      const policyTool = policyTools[Math.floor(Math.random() * policyTools.length)];
      
      const eventNames = ['Congressional Testimony', 'Press Conference', 'Economic Symposium', 'Policy Forum', 'Annual Meeting', 'Financial Summit'];
      const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
      
      const coordActions = ['Liquidity Provision', 'Currency Swap Lines', 'Unified Rate Action', 'Financial Stability Measures', 'Market Intervention'];
      const coordAction = coordActions[Math.floor(Math.random() * coordActions.length)];
      
      const globalIssues = ['Market Volatility', 'Banking System Strains', 'Currency Fluctuations', 'Growth Slowdown', 'Financial Contagion', 'Inflation Pressures'];
      const globalIssue = globalIssues[Math.floor(Math.random() * globalIssues.length)];
      
      const coordImpact = 0.03 + Math.random() * 0.04;
      
      const facilityNames = ['Asset Purchase Program', 'Repo Operations', 'Discount Window', 'Lending Facility', 'Collateral Requirements', 'Standing Facility'];
      const facilityName = facilityNames[Math.floor(Math.random() * facilityNames.length)];
      
      const adjustAmount = (Math.random() * 100 + 20).toFixed(0);
      
      const marketReactions = ['Boosting', 'Reassuring', 'Stabilizing', 'Concerning', 'Surprising', 'Confusing'];
      const marketReaction = marketReactions[Math.floor(Math.random() * marketReactions.length)];
      
      const adjustImpact = marketReaction === 'Boosting' || marketReaction === 'Reassuring' || marketReaction === 'Stabilizing' ?
        0.02 + Math.random() * 0.03 : -0.02 - Math.random() * 0.03;
      
      const direction = Math.random() > 0.5 ? 'Hikes' : 'Cuts';
      const directionImpactSimple = direction === 'Hikes' ? -0.03 - Math.random() * 0.02 : 0.03 + Math.random() * 0.02;
      
      const body = `${centralBank} announced its latest decision on monetary policy, affecting global financial markets. The central bank's action on interest rates reflects their assessment of inflation, employment, and overall economic conditions. Financial markets are adjusting to the implications of this policy decision.`;
      
      return { 
        centralBank, centralBankChair, basisPoints, inflationRate,
        economicConcern, holdAction, currentRate, forwardGuidance,
        holdImpact, monetaryDirection, directionImpact, directionImpactSimple,
        policyTool, eventName, coordAction, globalIssue,
        coordImpact, facilityName, adjustAmount, marketReaction,
        adjustImpact, direction,
        body
      };
    }
  },
  {
    name: 'Economic Indicators',
    templates: [
      { headline: 'Market Event: Q{quarter} GDP {direction} by {percentChange}%, {comparisonToExpectations} Forecasts of {forecastValue}%', impact: '{gdpImpact}', importance: 5 },
      { headline: 'Market Event: Unemployment Rate {jobDirection} to {jobRate}%, Economy {jobsCreated}K Jobs in {month}', impact: '{jobsImpact}', importance: 5 },
      { headline: 'Market Event: Inflation {inflationDirection} to {inflationRate}% {timeframe}, {comparisonTo} {comparisonValue}%', impact: '{inflationImpact}', importance: 5 },
      { headline: 'Market Event: {economicIndex} {indexDirection} to {indexValue}, {duration} {trend}', impact: '{indexImpact}', importance: 4 },
      { headline: 'Market Event: Retail Sales {retailDirection} {retailChange}% in {month}, {retailSector} Sector Leading', impact: '{retailImpact}', importance: 4 },
      { headline: 'Market Event: Housing Starts {housingDirection} {housingChange}%, Mortgage Rates at {mortgageRate}%', impact: '{housingImpact}', importance: 3 },
      { headline: 'Market Event: Industrial Production {indDirection} {indChange}%, {indSector} Shows {indSectorPerf}', impact: '{indImpact}', importance: 3 },
      { headline: 'Market Event: Consumer Sentiment {sentimentDirection} to {sentimentValue}, {sentimentOutlook} for Economy', impact: '{sentimentImpact}', importance: 4 },
    ],
    generateDetails: () => {
      // GDP details
      const quarter = Math.ceil(Math.random() * 4);
      const isGDPPositive = Math.random() > 0.4;
      const direction = isGDPPositive ? 'Grows' : 'Contracts';
      const percentChange = (Math.random() * 3 + 0.5).toFixed(1);
      
      const comparisons = ['Beating', 'Missing', 'Matching', 'Slightly Above', 'Well Below', 'In Line With'];
      const comparisonToExpectations = comparisons[Math.floor(Math.random() * comparisons.length)];
      
      const forecastValue = (Math.random() * 2 + 1).toFixed(1);
      
      const gdpImpact = isGDPPositive ? 
        (comparisonToExpectations === 'Beating' || comparisonToExpectations === 'Slightly Above' ? 0.04 + Math.random() * 0.03 : 0.02 + Math.random() * 0.02) : 
        (comparisonToExpectations === 'Missing' || comparisonToExpectations === 'Well Below' ? -0.04 - Math.random() * 0.03 : -0.02 - Math.random() * 0.02);
      
      // Jobs/unemployment details
      const jobWorse = Math.random() > 0.6;
      const jobDirection = jobWorse ? 'Rises' : 'Falls';
      const jobRate = (Math.random() * 2 + 3).toFixed(1);
      const jobsCreated = Math.floor(Math.random() * 300 + 50);
      const jobsImpact = jobWorse ? -0.03 - Math.random() * 0.02 : 0.03 + Math.random() * 0.02;
      
      // Inflation details
      const inflationWorse = Math.random() > 0.5;
      const inflationDirection = inflationWorse ? 'Rises' : 'Cools';
      const inflationRate = (Math.random() * 3 + 2).toFixed(1);
      
      const timeframes = ['Year-over-Year', 'Month-over-Month', 'Annualized', 'Quarter-over-Quarter'];
      const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      
      const comparisonTypes = ['Down From', 'Up From', 'Steady From', 'Compared to'];
      const comparisonTo = comparisonTypes[Math.floor(Math.random() * comparisonTypes.length)];
      
      const comparisonValue = (Math.random() * 3 + 2).toFixed(1);
      
      const inflationImpact = inflationWorse ? -0.03 - Math.random() * 0.03 : 0.03 + Math.random() * 0.03;
      
      // Economic indices
      const economicIndices = ['Consumer Confidence Index', 'Manufacturing PMI', 'Services PMI', 'Leading Economic Indicators', 'Business Optimism Index', 'Producer Price Index'];
      const economicIndex = economicIndices[Math.floor(Math.random() * economicIndices.length)];
      
      const indexImproving = Math.random() > 0.5;
      const indexDirection = indexImproving ? 'Improves' : 'Declines';
      const indexValue = Math.floor(Math.random() * 40 + 40);
      
      const durations = ['Third Consecutive', 'First Time in 6 Months', 'Continuing', 'Reversing Previous', 'Unexpected'];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      
      const trends = ['Improvement', 'Decline', 'Expansion', 'Contraction', 'Stabilization'];
      const trend = trends[Math.floor(Math.random() * trends.length)];
      
      const indexImpact = indexImproving ? 0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.02;
      
      // Retail sales details
      const retailBetter = Math.random() > 0.5;
      const retailDirection = retailBetter ? 'Grow' : 'Fall';
      const retailChange = (Math.random() * 3 + 0.5).toFixed(1);
      
      const retailSectors = ['Online', 'Electronics', 'Apparel', 'Food & Beverage', 'Home Improvement', 'Automotive'];
      const retailSector = retailSectors[Math.floor(Math.random() * retailSectors.length)];
      
      const retailImpact = retailBetter ? 0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.02;
      
      // Housing details
      const housingBetter = Math.random() > 0.5;
      const housingDirection = housingBetter ? 'Increase' : 'Decrease';
      const housingChange = (Math.random() * 8 + 1).toFixed(1);
      const mortgageRate = (Math.random() * 3 + 4).toFixed(2);
      
      const housingImpact = housingBetter ? 0.02 + Math.random() * 0.01 : -0.02 - Math.random() * 0.01;
      
      // Industrial production
      const indBetter = Math.random() > 0.5;
      const indDirection = indBetter ? 'Rises' : 'Falls';
      const indChange = (Math.random() * 3 + 0.3).toFixed(1);
      
      const indSectors = ['Manufacturing', 'Mining', 'Utilities', 'Construction', 'Technology', 'Automotive'];
      const indSector = indSectors[Math.floor(Math.random() * indSectors.length)];
      
      const indSectorPerfs = ['Strength', 'Weakness', 'Recovery', 'Decline', 'Stability'];
      const indSectorPerf = indSectorPerfs[Math.floor(Math.random() * indSectorPerfs.length)];
      
      const indImpact = indBetter ? 0.02 + Math.random() * 0.01 : -0.02 - Math.random() * 0.01;
      
      // Consumer sentiment
      const sentimentBetter = Math.random() > 0.5;
      const sentimentDirection = sentimentBetter ? 'Rises' : 'Falls';
      const sentimentValue = Math.floor(Math.random() * 30 + 70);
      
      const sentimentOutlooks = ['Improving Outlook', 'Worsening Outlook', 'Mixed Signals', 'Cautious Optimism', 'Growing Concerns'];
      const sentimentOutlook = sentimentOutlooks[Math.floor(Math.random() * sentimentOutlooks.length)];
      
      const sentimentImpact = sentimentBetter ? 0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.02;
      
      // Common month names
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = months[Math.floor(Math.random() * months.length)];
      
      const body = isGDPPositive ? 
        `Economic data shows stronger than expected growth in the ${quarter} quarter, suggesting resilient economic conditions. Financial markets are reacting positively to this development.` : 
        `Recent economic indicators show signs of slowing growth, raising concerns about broader economic health. Market participants are reassessing expectations for future performance.`;
      
      return { 
        quarter, direction, percentChange, comparisonToExpectations, forecastValue, gdpImpact,
        jobDirection, jobRate, jobsCreated, jobsImpact,
        inflationDirection, inflationRate, timeframe, comparisonTo, comparisonValue, inflationImpact,
        economicIndex, indexDirection, indexValue, duration, trend, indexImpact,
        retailDirection, retailChange, retailSector, retailImpact,
        housingDirection, housingChange, mortgageRate, housingImpact,
        indDirection, indChange, indSector, indSectorPerf, indImpact,
        sentimentDirection, sentimentValue, sentimentOutlook, sentimentImpact,
        month,
        body
      };
    }
  },
  {
    name: 'Global Events',
    templates: [
      { headline: 'Market Event: {countriesInvolved} Sign Historic {agreementType} Agreement, {industryImpacted} Sector Reacts', impact: '{agreementImpact}', importance: 4 },
      { headline: 'Market Event: {geoTension} Escalates in {region}, {commodityAffected} Prices {commodityDirection} {commodityChange}%', impact: '{tensionImpact}', importance: 5 },
      { headline: 'Market Event: {country} Announces {policyType} Policy Shift, Global Markets {marketReaction}', impact: '{policyImpact}', importance: 4 },
      { headline: 'Market Event: {currency} {currencyDirection} {currencyChange}% Against Dollar on {currencyEvent}', impact: '{currencyImpact}', importance: 4 },
      { headline: 'Market Event: Global Supply Chain {supplyIssue} Affects {industry} Production, Delivery Times {deliveryChange}', impact: '{supplyImpact}', importance: 4 },
      { headline: 'Market Event: {organization} Forecasts {forecastDirection} {economicMetric} for {region}, {forecastAdjustment} Previous Estimates', impact: '{forecastImpact}', importance: 3 },
      { headline: 'Market Event: Natural Disaster in {region} Disrupts {affectedSector}, Insurance Losses Estimated at ${insuranceLoss}B', impact: -0.03, importance: 4 },
      { headline: 'Market Event: {country} Election Results {electionImpact} Market Sentiment, {sectorEffect} {direction}', impact: '{electionImpact}', importance: 4 },
    ],
    generateDetails: () => {
      // Trade agreements
      const countrySets = [
        'US and EU', 'China and Russia', 'Japan and South Korea', 'UK and Australia', 
        'Brazil and Argentina', 'India and Singapore', 'G7 Nations', 'ASEAN Members'
      ];
      const countriesInvolved = countrySets[Math.floor(Math.random() * countrySets.length)];
      
      const agreementTypes = ['Trade', 'Technology', 'Energy', 'Climate', 'Defense', 'Digital Economy', 'Financial'];
      const agreementType = agreementTypes[Math.floor(Math.random() * agreementTypes.length)];
      
      const industries = ['Technology', 'Automotive', 'Agriculture', 'Energy', 'Manufacturing', 'Healthcare', 'Financial Services'];
      const industryImpacted = industries[Math.floor(Math.random() * industries.length)];
      
      const agreementPositive = Math.random() > 0.3;
      const agreementImpact = agreementPositive ? 0.03 + Math.random() * 0.03 : -0.01 - Math.random() * 0.02;
      
      // Geopolitical tensions
      const geoTensions = ['Military Conflict', 'Diplomatic Tensions', 'Trade Dispute', 'Political Instability', 'Territorial Dispute', 'Sanctions'];
      const geoTension = geoTensions[Math.floor(Math.random() * geoTensions.length)];
      
      const regions = [
        'East Asia', 'Middle East', 'Eastern Europe', 'South China Sea', 
        'North Africa', 'Latin America', 'South Asia', 'Western Pacific'
      ];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      const commodities = ['Oil', 'Natural Gas', 'Gold', 'Agricultural Commodities', 'Rare Earth Metals', 'Industrial Metals'];
      const commodityAffected = commodities[Math.floor(Math.random() * commodities.length)];
      
      const commodityUp = Math.random() > 0.3;
      const commodityDirection = commodityUp ? 'Surge' : 'Plunge';
      const commodityChange = (Math.random() * 8 + 2).toFixed(1);
      
      const tensionImpact = -0.03 - Math.random() * 0.03;
      
      // Country policies
      const countries = [
        'China', 'United States', 'European Union', 'Japan', 'Russia', 
        'Germany', 'India', 'United Kingdom', 'Brazil', 'Australia'
      ];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      const policyTypes = ['Fiscal Stimulus', 'Tax Reform', 'Industrial', 'Trade', 'Environmental', 'Technology', 'Immigration'];
      const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
      
      const marketReactions = ['Rally', 'Decline', 'Show Mixed Reaction', 'Initially Stumble, Then Recover', 'Remain Cautious'];
      const marketReaction = marketReactions[Math.floor(Math.random() * marketReactions.length)];
      
      const policyImpact = marketReaction === 'Rally' ? 0.03 + Math.random() * 0.03 : 
        marketReaction === 'Decline' ? -0.03 - Math.random() * 0.03 : 
        marketReaction === 'Show Mixed Reaction' ? (Math.random() > 0.5 ? 0.01 : -0.01) : 
        marketReaction === 'Initially Stumble, Then Recover' ? 0.01 + Math.random() * 0.02 : 
        -0.01 - Math.random() * 0.01;
      
      // Currency events
      const currencies = ['Euro', 'Yen', 'Yuan', 'Pound', 'Swiss Franc', 'Canadian Dollar', 'Australian Dollar', 'Russian Ruble'];
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      
      const currencyStrengthens = Math.random() > 0.5;
      const currencyDirection = currencyStrengthens ? 'Strengthens' : 'Weakens';
      const currencyChange = (Math.random() * 3 + 0.5).toFixed(2);
      
      const currencyEvents = [
        'Interest Rate Decision', 'Trade Balance Data', 'Political Developments', 
        'Economic Growth Figures', 'Central Bank Intervention', 'Inflation Report'
      ];
      const currencyEvent = currencyEvents[Math.floor(Math.random() * currencyEvents.length)];
      
      const currencyImpact = currencyStrengthens ? 
        (currency === 'Euro' || currency === 'Yen' ? -0.01 - Math.random() * 0.02 : 0.01 + Math.random() * 0.02) : 
        (currency === 'Euro' || currency === 'Yen' ? 0.01 + Math.random() * 0.02 : -0.01 - Math.random() * 0.02);
      
      // Supply chain
      const supplyIssues = ['Disruptions', 'Bottlenecks', 'Improvements', 'Restructuring', 'Shortages', 'Normalization'];
      const supplyIssue = supplyIssues[Math.floor(Math.random() * supplyIssues.length)];
      
      const industry = industries[Math.floor(Math.random() * industries.length)];
      
      const deliveryChanges = ['Extend Significantly', 'Improve Marginally', 'Return to Normal', 'Reach Record Delays', 'Show Regional Variations'];
      const deliveryChange = deliveryChanges[Math.floor(Math.random() * deliveryChanges.length)];
      
      const supplyImpact = supplyIssue === 'Improvements' || supplyIssue === 'Normalization' ? 
        0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.03;
      
      // Forecasts
      const organizations = ['IMF', 'World Bank', 'OECD', 'WTO', 'United Nations', 'G20', 'Economic Forum'];
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      
      const forecastDirections = ['Higher', 'Lower', 'Stable', 'Mixed', 'Volatile'];
      const forecastDirection = forecastDirections[Math.floor(Math.random() * forecastDirections.length)];
      
      const economicMetrics = ['GDP Growth', 'Inflation', 'Trade Volume', 'Investment Flows', 'Consumer Spending', 'Industrial Output'];
      const economicMetric = economicMetrics[Math.floor(Math.random() * economicMetrics.length)];
      
      const forecastAdjustments = ['Revising Up From', 'Cutting Below', 'Maintaining', 'Significantly Altering', 'Slightly Modifying'];
      const forecastAdjustment = forecastAdjustments[Math.floor(Math.random() * forecastAdjustments.length)];
      
      const forecastImpact = (forecastDirection === 'Higher' && economicMetric !== 'Inflation') || forecastAdjustment === 'Revising Up From' ? 
        0.02 + Math.random() * 0.02 : (forecastDirection === 'Lower' || forecastAdjustment === 'Cutting Below') ? 
        -0.02 - Math.random() * 0.02 : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      // Natural disasters
      const insuranceLoss = (Math.random() * 50 + 10).toFixed(1);
      const affectedSectors = ['Transport Infrastructure', 'Manufacturing Facilities', 'Energy Production', 'Agricultural Output', 'Shipping Routes'];
      const affectedSector = affectedSectors[Math.floor(Math.random() * affectedSectors.length)];
      
      // Elections
      const electionResults = ['Create Uncertainty', 'Boost Confidence', 'Raise Concerns', 'Provide Clarity'];
      const electionResult = electionResults[Math.floor(Math.random() * electionResults.length)];
      const electionImpactValue = electionResult === 'Boost Confidence' || electionResult === 'Provide Clarity' ? 
        0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.02;
      
      const sectorEffects = ['Banking Stocks', 'Energy Companies', 'Technology Shares', 'Healthcare Providers', 'Defense Contractors'];
      const sectorEffect = sectorEffects[Math.floor(Math.random() * sectorEffects.length)];
      
      const direction = electionResult === 'Boost Confidence' || electionResult === 'Provide Clarity' ? 'Rally' : 'Decline';
      
      const body = `Global financial markets are reacting to significant developments in ${region}. The impacts are particularly notable in the ${industryImpacted} sector, with potential long-term implications for related industries. Investors are closely monitoring policy responses from major economies.`;
      
      return { 
        countriesInvolved, agreementType, industryImpacted, agreementImpact,
        geoTension, region, commodityAffected, commodityDirection, commodityChange, tensionImpact,
        country, policyType, marketReaction, policyImpact,
        currency, currencyDirection, currencyChange, currencyEvent, currencyImpact,
        supplyIssue, industry, deliveryChange, supplyImpact,
        organization, forecastDirection, economicMetric, forecastAdjustment, forecastImpact,
        insuranceLoss, affectedSector,
        electionResult, electionImpactValue, sectorEffect, direction,
        body
      };
    }
  },
];

// Sector event templates
const SECTOR_EVENT_TEMPLATES = [
  {
    name: 'Technology Sector',
    sector: 'Technology',
    templates: [
      { headline: 'Sector Event: AI Breakthrough Sends Tech Stocks {direction}, {companyName} Leads with {percentChange}% Move', impact: '{directionImpact}', importance: 5 },
      { headline: 'Sector Event: Global Chip Shortage {status}, {companyName} Adjusts Production Targets by {percentChange}%', impact: '{statusImpact}', importance: 4 },
      { headline: 'Sector Event: Major Cybersecurity Breach at {companyName} Exposes {dataAmount} Million User Records', impact: -0.04, importance: 4 },
      { headline: 'Sector Event: {region} Announces Strict Tech Antitrust Laws, {companyName} Faces {fineAmount}B Fine', impact: -0.05, importance: 5 },
      { headline: 'Sector Event: Cloud Computing Demand {direction} {percentChange}%, {companyName} Adjusts Forecasts', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: Social Media Usage {direction} {percentChange}% in Q{quarter}, Advertising Revenue Impacted', impact: '{directionImpact}', importance: 3 },
      { headline: 'Sector Event: {companyName} Unveils Revolutionary {productType}, Tech Sector Reacts with {percentChange}% Surge', impact: 0.06, importance: 5 },
      { headline: 'Sector Event: Semiconductor Production Costs {direction} {percentChange}% Due to {resourceName} Shortage', impact: '{directionImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Surge' : 'Plummet';
      const directionImpact = direction === 'Surge' ? (0.03 + Math.random() * 0.04) : -(0.03 + Math.random() * 0.04);
      
      const status = Math.random() > 0.5 ? 'Eases as Production Ramps Up' : 'Worsens as Demand Outpaces Supply';
      const statusImpact = status.includes('Eases') ? (0.02 + Math.random() * 0.03) : -(0.02 + Math.random() * 0.04);
      
      const earningsDirection = Math.random() > 0.6 ? 'Record-Breaking' : (Math.random() > 0.5 ? 'Disappointing' : 'Mixed');
      const earningsImpact = earningsDirection === 'Record-Breaking' ? (0.04 + Math.random() * 0.03) : (earningsDirection === 'Disappointing' ? -(0.03 + Math.random() * 0.04) : (Math.random() > 0.5 ? 0.01 : -0.01));
      
      const techCompanies = ['MicroTech', 'Quantum Systems', 'CyberCore', 'DataSphere', 'NexGen', 'TechGiant', 'InfoStream', 'ByteForge', 'AlphaLogic', 'NetPeak'];
      const companyName = techCompanies[Math.floor(Math.random() * techCompanies.length)];
      
      const percentChange = (Math.random() * 15 + 5).toFixed(1);
      const dataAmount = Math.floor(Math.random() * 100 + 10);
      const fineAmount = (Math.random() * 10 + 1).toFixed(1);
      
      const regions = ['EU Commission', 'US FTC', 'Chinese Regulators', 'UK Competition Authority', 'Global Tech Council'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      const productTypes = ['Quantum Processor', 'AI Assistant', 'Neural Interface', 'Virtual Reality System', 'Augmented Reality Glasses', 'Self-Learning Algorithm'];
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      
      const resources = ['Rare Earth Metals', 'Silicon', 'Manufacturing Capacity', 'Specialized Labor', 'Component Parts'];
      const resourceName = resources[Math.floor(Math.random() * resources.length)];
      
      const quarter = Math.ceil(Math.random() * 4);
      
      const body = direction === 'Surge' 
        ? `Technology companies are experiencing significant growth as ${companyName} leads the sector with innovative solutions. Analysts predict continued expansion in the coming months.` 
        : `Technology sector faces challenges with ${companyName} particularly affected. Market strategists recommend caution as the sector adjusts to new conditions.`;
      
      return { 
        direction, directionImpact, 
        status, statusImpact,
        earningsDirection, earningsImpact,
        companyName, percentChange, dataAmount, fineAmount,
        region, productType, resourceName, quarter,
        body,
        related_sectors: ['Technology', 'Software', 'Hardware', 'Semiconductors', 'Cybersecurity']
      };
    }
  },
  {
    name: 'Financial Sector',
    sector: 'Finance',
    templates: [
      { headline: 'Sector Event: {centralBank} {rateAction} Interest Rates by {basisPoints} bps, Banking Stocks {direction}', impact: '{directionImpact}', importance: 5 },
      { headline: 'Sector Event: {regulator} Imposes ${fineAmount}B Fine on {bankName} for {violationType} Violations', impact: -0.04, importance: 4 },
      { headline: 'Sector Event: {bankName} Reports Q{quarter} Profits {profitDirection} by {percentChange}%, Sector {direction}', impact: '{profitImpact}', importance: 4 },
      { headline: 'Sector Event: Financial Institutions Face New {regulationType} Requirements, Compliance Costs to Rise {percentChange}%', impact: -0.03, importance: 3 },
      { headline: 'Sector Event: Insurance Sector {direction} {percentChange}% Following {disasterType} in {region}', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: {bankName} to {mergerAction} with {targetBank}, Creating ${assetSize}T Financial Giant', impact: 0.05, importance: 5 },
      { headline: 'Sector Event: FinTech Disruption Accelerates, Traditional Banks {direction} as {techFirm} Enters Market', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: Mortgage Rates {direction} to {rateValue}%, {mortgageAction} Housing Market', impact: '{directionImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Rally' : 'Slump';
      const directionImpact = direction === 'Rally' ? (0.02 + Math.random() * 0.04) : -(0.02 + Math.random() * 0.05);
      
      const centralBanks = ['Federal Reserve', 'European Central Bank', 'Bank of England', 'Bank of Japan', 'People\'s Bank of China'];
      const centralBank = centralBanks[Math.floor(Math.random() * centralBanks.length)];
      
      const rateAction = Math.random() > 0.6 ? 'Raises' : (Math.random() > 0.5 ? 'Cuts' : 'Maintains');
      const basisPoints = Math.floor(Math.random() * 50 + 25);
      
      const banks = ['GlobeBank', 'FirstNational', 'InvestCorp', 'MerchantTrust', 'SovereignFinancial', 'MetroBank', 'AtlasCapital', 'OmegaFinance'];
      const bankName = banks[Math.floor(Math.random() * banks.length)];
      const targetBank = banks[Math.floor(Math.random() * banks.length)];
      
      const regulators = ['SEC', 'Federal Reserve', 'OCC', 'FDIC', 'CFPB', 'European Banking Authority'];
      const regulator = regulators[Math.floor(Math.random() * regulators.length)];
      
      const violationTypes = ['Money Laundering', 'Market Manipulation', 'Consumer Protection', 'Regulatory Reporting', 'Capital Requirement'];
      const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)];
      
      const regulationTypes = ['Capital', 'Liquidity', 'Stress Testing', 'Consumer Protection', 'Risk Management', 'Cybersecurity'];
      const regulationType = regulationTypes[Math.floor(Math.random() * regulationTypes.length)];
      
      const profitDirection = Math.random() > 0.5 ? 'Up' : 'Down';
      const profitImpact = profitDirection === 'Up' ? (0.03 + Math.random() * 0.04) : -(0.03 + Math.random() * 0.04);
      
      const mergerActions = ['Merge', 'Acquire', 'Form Strategic Partnership'];
      const mergerAction = mergerActions[Math.floor(Math.random() * mergerActions.length)];
      
      const assetSize = (Math.random() * 5 + 1).toFixed(1);
      const fineAmount = (Math.random() * 10 + 1).toFixed(1);
      const percentChange = (Math.random() * 20 + 5).toFixed(1);
      
      const techFirms = ['PayTech', 'DigiWallet', 'BlockChain Financial', 'TechPay', 'CryptoBank'];
      const techFirm = techFirms[Math.floor(Math.random() * techFirms.length)];
      
      const rateValue = (Math.random() * 3 + 3).toFixed(2);
      const mortgageActions = ['Cooling', 'Stimulating', 'Restructuring', 'Transforming'];
      const mortgageAction = mortgageActions[Math.floor(Math.random() * mortgageActions.length)];
      
      const disasterTypes = ['Hurricane', 'Flood', 'Wildfire', 'Earthquake', 'Pandemic Resurgence', 'Cyber Attack'];
      const disasterType = disasterTypes[Math.floor(Math.random() * disasterTypes.length)];
      
      const regions = ['Southeast Asia', 'Eastern Europe', 'Western United States', 'Gulf Coast', 'Mediterranean Region', 'Pacific Islands'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      const quarter = Math.ceil(Math.random() * 4);
      
      const body = direction === 'Rally' 
        ? `Financial institutions are showing strength with ${bankName} leading gains. ${centralBank}'s policies have created favorable conditions for the banking sector.` 
        : `The financial sector is facing headwinds as ${bankName} struggles with changing market conditions. Regulatory pressures and economic uncertainty contribute to the downturn.`;
      
      return { 
        direction, directionImpact,
        centralBank, rateAction, basisPoints,
        bankName, targetBank, regulator, violationType,
        regulationType, profitDirection, profitImpact,
        mergerAction, assetSize, fineAmount, percentChange,
        techFirm, rateValue, mortgageAction,
        disasterType, region, quarter,
        body,
        related_sectors: ['Finance', 'Banking', 'Insurance', 'Investment Services', 'FinTech']
      };
    }
  },
  {
    name: 'Energy Sector',
    sector: 'Energy',
    templates: [
      { headline: 'Sector Event: Crude Oil Prices {direction} {percentChange}% After {oilEvent} in {region}', impact: '{directionImpact}', importance: 5 },
      { headline: 'Sector Event: {energyCompany} Announces ${investmentAmount}B Investment in {renewableType} Energy', impact: 0.05, importance: 4 },
      { headline: 'Sector Event: {country} Announces Plans to {policyAction} Fossil Fuel {policyType} by {targetYear}', impact: '{policyImpact}', importance: 4 },
      { headline: 'Sector Event: Natural Gas Prices {direction} {percentChange}% on {weatherEvent} Forecast for {region}', impact: '{directionImpact}', importance: 4 },
      { headline: 'Sector Event: {cartelName} {productionAction} Oil Production by {productionChange} Million Barrels Per Day', impact: '{productionImpact}', importance: 5 },
      { headline: 'Sector Event: {energyCompany} Reports {incidentType} at {facilityType} Facility, Production {productionEffect}', impact: -0.04, importance: 4 },
      { headline: 'Sector Event: Renewable Energy Costs {direction} {percentChange}% as {technologyType} Efficiency Improves', impact: '{renewableImpact}', importance: 3 },
      { headline: 'Sector Event: Global Energy Demand Projected to {demandDirection} {percentChange}% by {forecastYear}, {fuelType} Leading', impact: '{demandImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Surge' : 'Plunge';
      const directionImpact = direction === 'Surge' ? (0.03 + Math.random() * 0.05) : -(0.03 + Math.random() * 0.05);
      
      const percentChange = (Math.random() * 15 + 5).toFixed(1);
      
      const oilEvents = ['Supply Disruption', 'Production Agreement', 'Strategic Reserve Release', 'Pipeline Shutdown', 'Geopolitical Tensions', 'Trade Sanctions'];
      const oilEvent = oilEvents[Math.floor(Math.random() * oilEvents.length)];
      
      const regions = ['Middle East', 'North Sea', 'Gulf of Mexico', 'Caspian Region', 'West Africa', 'North America'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      const energyCompanies = ['GlobalEnergy', 'PetroCorp', 'EnergyOne', 'FossilFuels Inc.', 'RenewaCorp', 'AtomicPower', 'SolarStream', 'GreenEnergy'];
      const energyCompany = energyCompanies[Math.floor(Math.random() * energyCompanies.length)];
      
      const investmentAmount = (Math.random() * 20 + 5).toFixed(1);
      
      const renewableTypes = ['Solar', 'Wind', 'Hydroelectric', 'Geothermal', 'Biomass', 'Hydrogen', 'Tidal'];
      const renewableType = renewableTypes[Math.floor(Math.random() * renewableTypes.length)];
      
      const countries = ['United States', 'European Union', 'China', 'India', 'Japan', 'Brazil', 'United Kingdom', 'Canada'];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      const policyActions = ['Phase Out', 'Double', 'Eliminate', 'Restructure', 'Cap', 'Tax'];
      const policyAction = policyActions[Math.floor(Math.random() * policyActions.length)];
      
      const policyTypes = ['Subsidies', 'Production', 'Consumption', 'Emissions', 'Imports', 'Infrastructure'];
      const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
      
      const targetYear = 2030 + Math.floor(Math.random() * 20);
      const policyImpact = policyAction === 'Phase Out' || policyAction === 'Eliminate' || policyAction === 'Tax' ? -0.03 - Math.random() * 0.03 : 0.03 + Math.random() * 0.03;
      
      const weatherEvents = ['Cold Snap', 'Heat Wave', 'Hurricane Season', 'Mild Winter', 'Drought', 'Flooding'];
      const weatherEvent = weatherEvents[Math.floor(Math.random() * weatherEvents.length)];
      
      const cartels = ['OPEC+', 'Major Producers', 'Energy Alliance', 'Oil Exporters', 'G7 Energy Council'];
      const cartelName = cartels[Math.floor(Math.random() * cartels.length)];
      
      const productionActions = ['Increases', 'Cuts', 'Maintains', 'Freezes', 'Reconsiders'];
      const productionAction = productionActions[Math.floor(Math.random() * productionActions.length)];
      
      const productionChange = (Math.random() * 3 + 0.5).toFixed(1);
      const productionImpact = productionAction === 'Increases' ? -0.04 - Math.random() * 0.03 : 0.04 + Math.random() * 0.03;
      
      const incidentTypes = ['Explosion', 'Leak', 'Fire', 'Technical Failure', 'Safety Violation', 'Cyber Attack'];
      const incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];
      
      const facilityTypes = ['Refinery', 'Offshore Platform', 'Pipeline', 'Storage', 'Processing', 'Terminal'];
      const facilityType = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];
      
      const productionEffects = ['Halted', 'Reduced by 50%', 'Temporarily Suspended', 'Minimally Affected', 'Severely Impacted'];
      const productionEffect = productionEffects[Math.floor(Math.random() * productionEffects.length)];
      
      const technologyTypes = ['Solar Panel', 'Wind Turbine', 'Battery Storage', 'Grid Integration', 'Smart Meter'];
      const technologyType = technologyTypes[Math.floor(Math.random() * technologyTypes.length)];
      
      const renewableImpact = direction === 'Surge' ? -0.02 - Math.random() * 0.02 : 0.03 + Math.random() * 0.03;
      
      const demandDirections = ['Increase', 'Decrease', 'Shift', 'Stabilize'];
      const demandDirection = demandDirections[Math.floor(Math.random() * demandDirections.length)];
      
      const demandImpact = demandDirection === 'Increase' ? 0.02 + Math.random() * 0.03 : -0.02 - Math.random() * 0.02;
      
      const forecastYear = 2030 + Math.floor(Math.random() * 15);
      
      const fuelTypes = ['Renewables', 'Natural Gas', 'Nuclear', 'Oil', 'Coal', 'Hydrogen'];
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
      
      const body = direction === 'Surge' 
        ? `Energy markets are responding to ${oilEvent} in ${region}, driving prices higher. ${energyCompany} is particularly affected by these developments.` 
        : `Energy sector faces downward pressure due to ${oilEvent} in ${region}. Analysts recommend watching ${energyCompany} as a bellwether for the industry.`;
      
      return { 
        direction, directionImpact, percentChange,
        oilEvent, region, energyCompany, investmentAmount,
        renewableType, country, policyAction, policyType,
        targetYear, policyImpact, weatherEvent,
        cartelName, productionAction, productionChange,
        productionImpact, incidentType, facilityType,
        productionEffect, technologyType, renewableImpact,
        demandDirection, demandImpact, forecastYear, fuelType,
        body,
        related_sectors: ['Energy', 'Oil & Gas', 'Utilities', 'Renewables', 'Natural Resources']
      };
    }
  },
  {
    name: 'Healthcare Sector',
    sector: 'Healthcare',
    templates: [
      { headline: 'Sector Event: {pharmaCompany} Reports {trialOutcome} Results for {drugType} Treatment, Stock {direction} {percentChange}%', impact: '{trialImpact}', importance: 5 },
      { headline: 'Sector Event: {country} Approves {therapyName} for {diseaseType}, {pharmaCompany} Leads Sector {direction}', impact: '{approvalImpact}', importance: 4 },
      { headline: 'Sector Event: Healthcare Spending in {region} Projected to {spendingDirection} {percentChange}% in {fiscalYear}', impact: '{spendingImpact}', importance: 3 },
      { headline: 'Sector Event: {regulatorName} Issues {decisionType} on {pharmaCompany}\'s {productType}, Market Reacts with {percentChange}% {direction}', impact: '{regulationImpact}', importance: 4 },
      { headline: 'Sector Event: {pharmaCompany} to {dealType} {targetCompany} for ${dealAmount}B, Adding {portfolioSize} Pipeline Products', impact: 0.06, importance: 5 },
      { headline: 'Sector Event: {insurerName} Announces {coverageAction} for {treatmentType} Treatments, Providers {direction}', impact: '{coverageImpact}', importance: 3 },
      { headline: 'Sector Event: Medical Device Makers {direction} as {hospitalGroup} Reports {deviceDemand} Demand', impact: '{deviceImpact}', importance: 3 },
      { headline: 'Sector Event: Healthcare Labor Costs {direction} {percentChange}% Amid {laborEvent}, Affecting Hospital Margins', impact: '{laborImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const direction = Math.random() > 0.5 ? 'Surge' : 'Plummet';
      const directionImpact = direction === 'Surge' ? (0.03 + Math.random() * 0.04) : -(0.03 + Math.random() * 0.04);
      
      const percentChange = (Math.random() * 20 + 5).toFixed(1);
      
      const pharmaCompanies = ['LifeScience', 'MediCorp', 'BioPharma', 'GeneticHealth', 'CuraTech', 'VitalMed', 'TherapeuticOne', 'MolecularRx'];
      const pharmaCompany = pharmaCompanies[Math.floor(Math.random() * pharmaCompanies.length)];
      const targetCompany = pharmaCompanies[Math.floor(Math.random() * pharmaCompanies.length)];
      
      const trialOutcomes = ['Breakthrough', 'Promising Phase III', 'Disappointing Phase II', 'Mixed', 'Groundbreaking', 'Inconclusive'];
      const trialOutcome = trialOutcomes[Math.floor(Math.random() * trialOutcomes.length)];
      
      const trialImpact = (trialOutcome === 'Breakthrough' || trialOutcome === 'Promising Phase III' || trialOutcome === 'Groundbreaking') ? 
        (0.05 + Math.random() * 0.05) : (trialOutcome === 'Disappointing Phase II' || trialOutcome === 'Inconclusive') ? 
        -(0.05 + Math.random() * 0.04) : (Math.random() > 0.5 ? 0.02 : -0.02);
      
      const drugTypes = ['Cancer', 'Diabetes', 'Alzheimer\'s', 'Immunotherapy', 'Cardiovascular', 'Rare Disease', 'Vaccine', 'Gene Therapy'];
      const drugType = drugTypes[Math.floor(Math.random() * drugTypes.length)];
      
      const countries = ['FDA', 'EMA', 'MHRA', 'Health Canada', 'Japanese Regulators', 'Chinese NMPA'];
      const country = countries[Math.floor(Math.random() * countries.length)];
      
      const therapyNames = ['Genefactor', 'Immunotide', 'Curaxen', 'Vitalmab', 'Theraprex', 'Novacel', 'Oncozyme', 'Cardiostat'];
      const therapyName = therapyNames[Math.floor(Math.random() * therapyNames.length)];
      
      const diseaseTypes = ['Metastatic Cancer', 'Type 2 Diabetes', 'Chronic Heart Failure', 'Autoimmune Disease', 'Rare Genetic Disorder', 'Infectious Disease'];
      const diseaseType = diseaseTypes[Math.floor(Math.random() * diseaseTypes.length)];
      
      const approvalImpact = 0.04 + Math.random() * 0.05;
      
      const regions = ['North America', 'Europe', 'Asia-Pacific', 'Emerging Markets', 'Global', 'Developed Markets'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      const spendingDirections = ['Increase', 'Decrease', 'Grow', 'Contract', 'Stabilize at'];
      const spendingDirection = spendingDirections[Math.floor(Math.random() * spendingDirections.length)];
      
      const spendingImpact = (spendingDirection === 'Increase' || spendingDirection === 'Grow') ? 
        (0.02 + Math.random() * 0.03) : (spendingDirection === 'Decrease' || spendingDirection === 'Contract') ? 
        -(0.02 + Math.random() * 0.03) : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      const fiscalYear = 2025 + Math.floor(Math.random() * 5);
      
      const regulators = ['FDA', 'EMA', 'WHO', 'Health Authority', 'Regulatory Committee', 'HHS'];
      const regulatorName = regulators[Math.floor(Math.random() * regulators.length)];
      
      const decisionTypes = ['Warning Letter', 'Approval', 'Rejection', 'Safety Alert', 'Priority Review', 'Clinical Hold'];
      const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)];
      
      const productTypes = ['Blockbuster Drug', 'Medical Device', 'Biosimilar', 'Diagnostic Test', 'Therapeutic', 'Vaccine'];
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      
      const regulationImpact = (decisionType === 'Approval' || decisionType === 'Priority Review') ? 
        (0.03 + Math.random() * 0.04) : (decisionType === 'Rejection' || decisionType === 'Warning Letter' || decisionType === 'Clinical Hold') ? 
        -(0.03 + Math.random() * 0.04) : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      const dealTypes = ['Acquire', 'Merge with', 'Partner with', 'Take Majority Stake in', 'Form Joint Venture with'];
      const dealType = dealTypes[Math.floor(Math.random() * dealTypes.length)];
      
      const dealAmount = (Math.random() * 50 + 10).toFixed(1);
      const portfolioSize = Math.floor(Math.random() * 20 + 3);
      
      const insurers = ['HealthGuard', 'MediCare Partners', 'InsurWell', 'NationalHealth', 'CareShield', 'LifeCoverage'];
      const insurerName = insurers[Math.floor(Math.random() * insurers.length)];
      
      const coverageActions = ['Expanded Coverage', 'Reduced Reimbursement', 'New Payment Model', 'Prior Authorization', 'Full Coverage'];
      const coverageAction = coverageActions[Math.floor(Math.random() * coverageActions.length)];
      
      const treatmentTypes = ['Gene Therapy', 'Specialty Medications', 'Preventive Care', 'Telehealth', 'Experimental', 'Home Care'];
      const treatmentType = treatmentTypes[Math.floor(Math.random() * treatmentTypes.length)];
      
      const coverageImpact = (coverageAction === 'Expanded Coverage' || coverageAction === 'Full Coverage') ? 
        (0.02 + Math.random() * 0.03) : (coverageAction === 'Reduced Reimbursement' || coverageAction === 'Prior Authorization') ? 
        -(0.02 + Math.random() * 0.03) : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      const hospitalGroups = ['Regional Hospitals', 'National Health Systems', 'Urban Medical Centers', 'Rural Providers', 'Teaching Hospitals'];
      const hospitalGroup = hospitalGroups[Math.floor(Math.random() * hospitalGroups.length)];
      
      const deviceDemands = ['Increasing', 'Decreasing', 'Record', 'Weak', 'Stable', 'Volatile'];
      const deviceDemand = deviceDemands[Math.floor(Math.random() * deviceDemands.length)];
      
      const deviceImpact = (deviceDemand === 'Increasing' || deviceDemand === 'Record') ? 
        (0.03 + Math.random() * 0.02) : (deviceDemand === 'Decreasing' || deviceDemand === 'Weak') ? 
        -(0.03 + Math.random() * 0.02) : (Math.random() > 0.5 ? 0.01 : -0.01);
      
      const laborEvents = ['Staffing Shortages', 'Union Negotiations', 'Industry Restructuring', 'Skill Demand Surge', 'Regulatory Changes'];
      const laborEvent = laborEvents[Math.floor(Math.random() * laborEvents.length)];
      
      const laborImpact = direction === 'Surge' ? -(0.02 + Math.random() * 0.02) : 0.02 + Math.random() * 0.02;
      
      const body = direction === 'Surge' 
        ? `Healthcare sector is experiencing positive momentum after ${pharmaCompany}'s announcement about ${therapyName}. Treatment for ${diseaseType} shows promising results in clinical trials.` 
        : `Healthcare stocks are under pressure as ${pharmaCompany}'s ${productType} faces challenges. Market analysts are closely watching regulatory developments affecting ${diseaseType} treatments.`;
      
      return { 
        direction, directionImpact, percentChange,
        pharmaCompany, targetCompany, trialOutcome, trialImpact,
        drugType, country, therapyName, diseaseType,
        approvalImpact, region, spendingDirection, spendingImpact,
        fiscalYear, regulatorName, decisionType, productType,
        regulationImpact, dealType, dealAmount, portfolioSize,
        insurerName, coverageAction, treatmentType, coverageImpact,
        hospitalGroup, deviceDemand, deviceImpact,
        laborEvent, laborImpact,
        body,
        related_sectors: ['Healthcare', 'Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Healthcare Providers']
      };
    }
  },
];

// Company event templates
const COMPANY_EVENT_TEMPLATES = [
  {
    name: 'Earnings Reports',
    templates: [
      { headline: 'Company Event: {company} Q{quarter} Earnings {beatsMisses} by ${epsAmount}, Revenue {revenueVerb} ${revenueAmount}B', impact: '{earningsImpact}', importance: 4 },
      { headline: 'Company Event: {company} Issues {guidanceDirection} Guidance for {guidanceTarget}, Shares {shareReaction} {shareAmount}%', impact: '{guidanceImpact}', importance: 4 },
      { headline: 'Company Event: {company} Reports {profitChange}% {profitDirection} in {segment} Segment, {segmentImportance} to Overall Results', impact: '{segmentImpact}', importance: 3 },
      { headline: 'Company Event: {company} Announces {margin}% {marginDirection} in Gross Margins, Citing {marginFactor}', impact: '{marginImpact}', importance: 3 },
      { headline: 'Company Event: Analysts {analyzeDirection} {company} After Earnings, {noteContent}', impact: '{analysisImpact}', importance: 3 },
      { headline: 'Company Event: {company} {resultPhrase} Driven by {driverType}, {executiveTitle} {commentType}', impact: '{resultImpact}', importance: 4 },
      { headline: 'Company Event: {company} to {capitalAction} Following {resultType} Earnings Report', impact: '{capitalImpact}', importance: 4 },
    ],
    generateDetails: () => {
      const companies = [
        { name: 'TechCorp', id: 1, sector: 'Technology' },
        { name: 'MegaBank', id: 2, sector: 'Finance' },
        { name: 'EnergyFuture', id: 3, sector: 'Energy' },
        { name: 'RetailGiant', id: 4, sector: 'Retail' },
        { name: 'HealthInnovate', id: 5, sector: 'Healthcare' },
        { name: 'GrowthSoftware', id: 6, sector: 'Technology' },
        { name: 'IndustrialPro', id: 7, sector: 'Manufacturing' },
        { name: 'FoodCorp', id: 8, sector: 'Consumer Goods' },
      ];
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      const quarter = Math.ceil(Math.random() * 4);
      
      // Earnings metrics
      const positiveEarnings = Math.random() > 0.4;
      const beatsMisses = positiveEarnings ? 'Beats Expectations' : 'Misses Forecasts';
      const epsAmount = (Math.random() * 0.5 + 0.05).toFixed(2);
      
      const positiveRevenue = Math.random() > 0.4;
      const revenueVerb = positiveRevenue ? 'Reaches' : 'Falls Short at';
      const revenueAmount = (Math.random() * 10 + 1).toFixed(1);
      
      const earningsImpact = (positiveEarnings && positiveRevenue) ? 0.06 + Math.random() * 0.04 : 
                            (!positiveEarnings && !positiveRevenue) ? -0.07 - Math.random() * 0.03 :
                            (positiveEarnings ? 0.02 + Math.random() * 0.03 : -0.03 - Math.random() * 0.03);
      
      // Guidance details
      const positiveGuidance = Math.random() > 0.4;
      const guidanceDirection = positiveGuidance ? 'Strong' : 'Cautious';
      
      const guidanceTargets = ['Next Quarter', 'Full Year', 'Revenue Growth', 'Profit Margins', 'Market Expansion'];
      const guidanceTarget = guidanceTargets[Math.floor(Math.random() * guidanceTargets.length)];
      
      const shareReaction = positiveGuidance ? 'Jump' : 'Drop';
      const shareAmount = (Math.random() * 8 + 2).toFixed(1);
      
      const guidanceImpact = positiveGuidance ? 0.05 + Math.random() * 0.04 : -0.06 - Math.random() * 0.04;
      
      // Segment performance
      const profitChange = (Math.random() * 25 + 5).toFixed(1);
      const profitDirection = Math.random() > 0.4 ? 'Growth' : 'Decline';
      
      const segments = {
        'Technology': ['Cloud Services', 'Hardware', 'Enterprise Solutions', 'Consumer Products'],
        'Finance': ['Investment Banking', 'Retail Banking', 'Asset Management', 'Trading'],
        'Energy': ['Renewable Energy', 'Exploration', 'Distribution', 'Power Generation'],
        'Retail': ['E-commerce', 'Brick & Mortar', 'International', 'Luxury Goods'],
        'Healthcare': ['Pharmaceuticals', 'Medical Devices', 'Patient Services', 'Research'],
        'Manufacturing': ['Consumer Products', 'Industrial Equipment', 'Auto Parts', 'Electronics'],
        'Consumer Goods': ['Packaged Foods', 'Beverages', 'Household Products', 'Personal Care']
      };
      
      const segment = segments[company.sector] ? 
        segments[company.sector][Math.floor(Math.random() * segments[company.sector].length)] : 
        'Core Business';
      
      const segmentImportances = ['Critical', 'Important', 'Contributing', 'Minor', 'Growing in Importance'];
      const segmentImportance = segmentImportances[Math.floor(Math.random() * segmentImportances.length)];
      
      const segmentImpact = (profitDirection === 'Growth' && (segmentImportance === 'Critical' || segmentImportance === 'Important')) ? 
        0.04 + Math.random() * 0.03 : 
        (profitDirection === 'Decline' && (segmentImportance === 'Critical' || segmentImportance === 'Important')) ? 
        -0.04 - Math.random() * 0.03 : 
        (profitDirection === 'Growth' ? 0.02 + Math.random() * 0.01 : -0.02 - Math.random() * 0.01);
      
      // Margin details
      const margin = (Math.random() * 10 + 20).toFixed(1);
      const marginDirection = Math.random() > 0.5 ? 'Improvement' : 'Contraction';
      
      const marginFactors = [
        'Cost Control Measures', 'Raw Material Costs', 'Supply Chain Efficiencies', 
        'Pricing Strategy', 'Production Scalability', 'Labor Costs',
        'Automation Investments', 'Market Competition'
      ];
      const marginFactor = marginFactors[Math.floor(Math.random() * marginFactors.length)];
      
      const marginImpact = marginDirection === 'Improvement' ? 0.03 + Math.random() * 0.02 : -0.03 - Math.random() * 0.02;
      
      // Analyst reactions
      const analyzeDirections = ['Upgrade', 'Downgrade', 'Maintain Outlook on', 'Raise Price Target for', 'Cut Price Target for', 'Initiate Coverage on'];
      const analyzeDirection = analyzeDirections[Math.floor(Math.random() * analyzeDirections.length)];
      
      const noteContents = [
        'Citing Growth Potential', 'Expressing Concern Over Margins', 'Highlighting Market Position', 
        'Pointing to Competitive Threats', 'Praising Management Execution', 'Questioning Strategy',
        'Emphasizing Valuation Concerns', 'Noting Technological Advantage'
      ];
      const noteContent = noteContents[Math.floor(Math.random() * noteContents.length)];
      
      const analysisImpact = (analyzeDirection === 'Upgrade' || analyzeDirection === 'Raise Price Target for') ? 
        0.04 + Math.random() * 0.03 : 
        (analyzeDirection === 'Downgrade' || analyzeDirection === 'Cut Price Target for') ? 
        -0.04 - Math.random() * 0.03 : 
        (noteContent.includes('Growth') || noteContent.includes('Advantage') || noteContent.includes('Praising')) ? 
        0.02 + Math.random() * 0.01 : 
        (noteContent.includes('Concern') || noteContent.includes('Threats') || noteContent.includes('Questioning')) ? 
        -0.02 - Math.random() * 0.01 : 
        0.01 * (Math.random() > 0.5 ? 1 : -1);
      
      // Executive comments
      const resultPhrases = [
        'Reports Strong Quarterly Performance', 'Posts Mixed Results', 'Exceeds Market Expectations', 
        'Announces Disappointing Earnings', 'Delivers Solid Growth', 'Faces Profitability Challenges'
      ];
      const resultPhrase = resultPhrases[Math.floor(Math.random() * resultPhrases.length)];
      
      const driverTypes = [
        'Expanding Customer Base', 'New Product Adoption', 'Cost-Cutting Initiatives', 
        'International Expansion', 'Strategic Partnerships', 'Operational Efficiencies',
        'Digital Transformation', 'Market Share Gains', 'Pricing Strategy'
      ];
      const driverType = driverTypes[Math.floor(Math.random() * driverTypes.length)];
      
      const executiveTitles = ['CEO', 'CFO', 'President', 'Chief Operating Officer', 'Executive Chairman'];
      const executiveTitle = executiveTitles[Math.floor(Math.random() * executiveTitles.length)];
      
      const commentTypes = [
        'Expresses Confidence in Strategy', 'Notes Challenging Environment', 'Highlights Future Opportunities', 
        'Announces Strategic Review', 'Details Growth Initiatives', 'Addresses Market Concerns'
      ];
      const commentType = commentTypes[Math.floor(Math.random() * commentTypes.length)];
      
      const resultImpact = resultPhrase.includes('Strong') || resultPhrase.includes('Exceeds') || resultPhrase.includes('Solid') ? 
        0.05 + Math.random() * 0.03 : 
        resultPhrase.includes('Disappointing') || resultPhrase.includes('Challenges') ? 
        -0.05 - Math.random() * 0.03 : 
        commentType.includes('Confidence') || commentType.includes('Opportunities') || commentType.includes('Growth') ? 
        0.02 + Math.random() * 0.02 : 
        commentType.includes('Challenging') || commentType.includes('Concerns') ? 
        -0.02 - Math.random() * 0.02 : 
        0.01 * (Math.random() > 0.5 ? 1 : -1);
      
      // Capital allocation
      const capitalActions = [
        'Increase Share Buyback Program', 'Raise Dividend by 10%', 'Cut Dividend', 
        'Issue New Shares', 'Announce Debt Reduction Plan', 'Restructure Debt',
        'Launch Special Dividend', 'Suspend Share Repurchases'
      ];
      const capitalAction = capitalActions[Math.floor(Math.random() * capitalActions.length)];
      
      const resultTypes = ['Strong', 'Mixed', 'Disappointing', 'Record', 'Better-Than-Expected', 'Below-Expectations'];
      const resultType = resultTypes[Math.floor(Math.random() * resultTypes.length)];
      
      const capitalImpact = (capitalAction.includes('Increase') || capitalAction.includes('Raise') || capitalAction.includes('Special')) ? 
        0.04 + Math.random() * 0.03 : 
        (capitalAction.includes('Cut') || capitalAction.includes('Suspend')) ? 
        -0.04 - Math.random() * 0.03 : 
        (resultType === 'Strong' || resultType === 'Record' || resultType === 'Better-Than-Expected') ? 
        0.03 + Math.random() * 0.02 : 
        (resultType === 'Disappointing' || resultType === 'Below-Expectations') ? 
        -0.03 - Math.random() * 0.02 : 
        0.01 * (Math.random() > 0.5 ? 1 : -1);
      
      // Generate a consistent body paragraph
      const positiveResult = resultPhrase.includes('Strong') || resultPhrase.includes('Exceeds') || resultPhrase.includes('Solid');
      const body = positiveResult ?
        `${company.name} (ID: ${company.id}) reported better than expected financial results, with particular strength in the ${segment} segment. Management expressed confidence in the company's strategic direction and future growth prospects.` :
        `${company.name} (ID: ${company.id}) announced earnings that fell short of expectations, with challenges particularly evident in the ${segment} segment. The company's management addressed investor concerns and outlined plans to improve performance going forward.`;
      
      return { 
        company: company.name,
        sector: company.sector,
        quarter,
        beatsMisses, epsAmount, revenueVerb, revenueAmount, earningsImpact,
        guidanceDirection, guidanceTarget, shareReaction, shareAmount, guidanceImpact,
        profitChange, profitDirection, segment, segmentImportance, segmentImpact,
        margin, marginDirection, marginFactor, marginImpact,
        analyzeDirection, noteContent, analysisImpact,
        resultPhrase, driverType, executiveTitle, commentType, resultImpact,
        capitalAction, resultType, capitalImpact,
        body,
        related_stocks: [company.id]
      };
    }
  },
  {
    name: 'Corporate Strategy',
    templates: [
      { headline: 'Company Event: {company} Announces {dealType} of {targetCompany} for ${dealAmount}B, {strategicValue}', impact: '{dealImpact}', importance: 5 },
      { headline: 'Company Event: {company} Unveils {strategyType} Strategy, Targets {strategyGoal} by {targetYear}', impact: '{strategyImpact}', importance: 4 },
      { headline: 'Company Event: {company} to {restructureAction} Operations, {actionImpact} {impactAmount} in {impactArea}', impact: '{restructureImpact}', importance: 4 },
      { headline: 'Company Event: {company} Expands into {newMarket} Market with {expansionMethod}, {analystView}', impact: '{expansionImpact}', importance: 4 },
      { headline: 'Company Event: {company} Announces {amount}% {workforceChange} of Workforce, {reasonPhrase}', impact: '{workforceImpact}', importance: 4 },
      { headline: 'Company Event: {company} {partnershipVerb} with {partnerCompany} to {partnershipGoal}, {timeframe} Initiative', impact: '{partnershipImpact}', importance: 3 },
      { headline: 'Company Event: {company} {investmentAction} ${amount}B in {technologyArea}, {executiveComment}', impact: '{investmentImpact}', importance: 4 },
      { headline: 'Company Event: {company} {policyVerb} {policyType} Policy, {policyDetail}', impact: '{policyImpact}', importance: 3 },
    ],
    generateDetails: () => {
      const companies = [
        { name: 'TechCorp', id: 1, sector: 'Technology' },
        { name: 'MegaBank', id: 2, sector: 'Finance' },
        { name: 'EnergyFuture', id: 3, sector: 'Energy' },
        { name: 'RetailGiant', id: 4, sector: 'Retail' },
        { name: 'HealthInnovate', id: 5, sector: 'Healthcare' },
        { name: 'GrowthSoftware', id: 6, sector: 'Technology' },
        { name: 'IndustrialPro', id: 7, sector: 'Manufacturing' },
        { name: 'FoodCorp', id: 8, sector: 'Consumer Goods' },
      ];
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      
      // Filter to get a different company for target/partner
      const potentialTargets = companies.filter(c => c.id !== company.id);
      const targetCompany = potentialTargets[Math.floor(Math.random() * potentialTargets.length)].name;
      const partnerCompany = potentialTargets[Math.floor(Math.random() * potentialTargets.length)].name;
      
      // Deal details
      const dealTypes = ['Acquisition', 'Merger', 'Majority Stake Purchase', 'Strategic Investment'];
      const dealType = dealTypes[Math.floor(Math.random() * dealTypes.length)];
      
      const dealAmount = (Math.random() * 40 + 5).toFixed(1);
      
      const strategicValues = [
        'Expanding Market Reach', 'Enhancing Product Portfolio', 'Gaining Technological Edge',
        'Entering New Vertical', 'Consolidating Industry Position', 'Accelerating Growth Strategy'
      ];
      const strategicValue = strategicValues[Math.floor(Math.random() * strategicValues.length)];
      
      const dealImpact = Math.random() > 0.3 ? 0.06 + Math.random() * 0.04 : -0.05 - Math.random() * 0.03;
      
      // Strategy announcements
      const strategyTypes = [
        'Digital Transformation', 'Sustainability', 'Innovation', 'Growth', 
        'Market Expansion', 'Cost Optimization', 'Operational Excellence'
      ];
      const strategyType = strategyTypes[Math.floor(Math.random() * strategyTypes.length)];
      
      const strategyGoals = [
        '50% Revenue Growth', 'Carbon Neutrality', 'Market Leadership', 
        'Doubled Profit Margins', 'Global Expansion', '$10B in New Sales',
        'Product Line Diversification', 'AI-Driven Operations'
      ];
      const strategyGoal = strategyGoals[Math.floor(Math.random() * strategyGoals.length)];
      
      const targetYear = 2025 + Math.floor(Math.random() * 10);
      
      const strategyImpact = Math.random() > 0.3 ? 0.04 + Math.random() * 0.03 : -0.02 - Math.random() * 0.03;
      
      // Restructuring
      const restructureActions = [
        'Streamline', 'Consolidate', 'Reorganize', 'Centralize', 
        'Decentralize', 'Optimize', 'Overhaul', 'Transform'
      ];
      const restructureAction = restructureActions[Math.floor(Math.random() * restructureActions.length)];
      
      const actionImpacts = ['Saving', 'Cutting', 'Reducing', 'Improving', 'Enhancing', 'Targeting'];
      const actionImpact = actionImpacts[Math.floor(Math.random() * actionImpacts.length)];
      
      const impactAmount = `$${(Math.random() * 900 + 100).toFixed(0)}M`;
      
      const impactAreas = ['Annual Costs', 'Operating Expenses', 'Process Efficiency', 'Production Costs', 'Supply Chain'];
      const impactArea = impactAreas[Math.floor(Math.random() * impactAreas.length)];
      
      const restructureImpact = (actionImpact === 'Saving' || actionImpact === 'Cutting' || actionImpact === 'Reducing') ?
        0.04 + Math.random() * 0.03 : Math.random() > 0.5 ? 0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.01;
      
      // Market expansion
      const newMarkets = [
        'European', 'Asian', 'Latin American', 'Healthcare', 'Automotive', 
        'Enterprise', 'Consumer', 'Digital', 'Renewable Energy', 'Financial Services'
      ];
      const newMarket = newMarkets[Math.floor(Math.random() * newMarkets.length)];
      
      const expansionMethods = [
        'New Product Line', 'Strategic Acquisition', 'Joint Venture', 
        'Licensing Agreement', 'Direct Investment', 'R&D Initiative'
      ];
      const expansionMethod = expansionMethods[Math.floor(Math.random() * expansionMethods.length)];
      
      const analystViews = [
        'Analysts Express Optimism', 'Market Response Positive', 'Raising Growth Expectations',
        'Some Analysts Question Timing', 'Integration Challenges Expected', 'Competitive Advantage Noted'
      ];
      const analystView = analystViews[Math.floor(Math.random() * analystViews.length)];
      
      const expansionImpact = (analystView.includes('Optimism') || analystView.includes('Positive') || analystView.includes('Raising') || analystView.includes('Advantage')) ?
        0.04 + Math.random() * 0.03 : (analystView.includes('Question') || analystView.includes('Challenges')) ?
        -0.02 - Math.random() * 0.02 : Math.random() > 0.6 ? 0.02 + Math.random() * 0.01 : -0.01 - Math.random() * 0.01;
      
      // Workforce changes
      const amount = (Math.random() * 15 + 5).toFixed(0);
      const workforceChanges = ['Reduction', 'Expansion', 'Reallocation', 'Retraining'];
      const workforceChange = workforceChanges[Math.floor(Math.random() * workforceChanges.length)];
      
      const reasonPhrases = [
        'Cost-Cutting Measure', 'Supporting Growth Strategy', 'Aligning with Digital Transformation',
        'Response to Market Conditions', 'Part of Strategic Restructuring', 'Addressing Skill Gaps'
      ];
      const reasonPhrase = reasonPhrases[Math.floor(Math.random() * reasonPhrases.length)];
      
      const workforceImpact = workforceChange === 'Reduction' ? 
        (reasonPhrase.includes('Growth') || reasonPhrase.includes('Digital') ? 0.01 + Math.random() * 0.02 : -0.04 - Math.random() * 0.03) : 
        workforceChange === 'Expansion' ? 0.03 + Math.random() * 0.02 : Math.random() > 0.5 ? 0.01 : -0.01;
      
      // Partnerships
      const partnershipVerbs = ['Forms Strategic Partnership', 'Announces Collaboration', 'Signs Agreement', 'Establishes Joint Venture'];
      const partnershipVerb = partnershipVerbs[Math.floor(Math.random() * partnershipVerbs.length)];
      
      const partnershipGoals = [
        'Develop New Technology', 'Enter Emerging Markets', 'Launch Innovative Product Line',
        'Enhance Supply Chain Efficiency', 'Accelerate Research Initiatives', 'Share Distribution Networks'
      ];
      const partnershipGoal = partnershipGoals[Math.floor(Math.random() * partnershipGoals.length)];
      
      const timeframes = ['Multi-Year', 'Five-Year', 'Long-Term', 'Initial Two-Year', 'Immediate'];
      const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      
      const partnershipImpact = Math.random() > 0.3 ? 0.03 + Math.random() * 0.02 : -0.01 - Math.random() * 0.02;
      
      // Investments
      const investmentActions = ['Invests', 'Commits', 'Allocates', 'Secures Funding of'];
      const investmentAction = investmentActions[Math.floor(Math.random() * investmentActions.length)];
      
      const technologyAreas = [
        'Artificial Intelligence', 'Sustainable Technology', 'Manufacturing Capacity',
        'Next-Generation Products', 'Cloud Infrastructure', 'Quantum Computing',
        'Research Facilities', 'Automation Solutions', '5G Technology'
      ];
      const technologyArea = technologyAreas[Math.floor(Math.random() * technologyAreas.length)];
      
      const executiveComments = [
        'CEO Highlights Strategic Importance', 'Aiming for Market Leadership', 
        'Expected to Deliver Long-Term Value', 'Addressing Competitive Pressures',
        'Building Foundation for Future Growth', 'Part of Multi-Phase Initiative'
      ];
      const executiveComment = executiveComments[Math.floor(Math.random() * executiveComments.length)];
      
      const investmentImpact = Math.random() > 0.25 ? 0.04 + Math.random() * 0.03 : -0.02 - Math.random() * 0.02;
      
      // Corporate policies
      const policyVerbs = ['Announces New', 'Updates', 'Revises', 'Implements', 'Adopts'];
      const policyVerb = policyVerbs[Math.floor(Math.random() * policyVerbs.length)];
      
      const policyTypes = [
        'Environmental', 'Remote Work', 'Executive Compensation', 'Shareholder Return',
        'Diversity & Inclusion', 'Corporate Governance', 'Data Privacy', 'Ethical AI'
      ];
      const policyType = policyTypes[Math.floor(Math.random() * policyTypes.length)];
      
      const policyDetails = [
        'Industry-Leading Standards', 'Responding to Regulatory Changes', 
        'Aligning with Strategic Vision', 'Addressing Stakeholder Concerns',
        'Enhancing Corporate Reputation', 'Setting New Benchmarks'
      ];
      const policyDetail = policyDetails[Math.floor(Math.random() * policyDetails.length)];
      
      const policyImpact = Math.random() > 0.4 ? 0.02 + Math.random() * 0.02 : -0.01 - Math.random() * 0.02;
      
      // Generate a consistent body paragraph
      const body = `${company.name} (ID: ${company.id}) has announced significant strategic initiatives that are expected to reshape its business operations and market position. These changes reflect the company's response to evolving industry dynamics and competitive pressures.`;
      
      return { 
        company: company.name,
        sector: company.sector,
        targetCompany, dealType, dealAmount, strategicValue, dealImpact,
        strategyType, strategyGoal, targetYear, strategyImpact,
        restructureAction, actionImpact, impactAmount, impactArea, restructureImpact,
        newMarket, expansionMethod, analystView, expansionImpact,
        amount, workforceChange, reasonPhrase, workforceImpact,
        partnershipVerb, partnerCompany, partnershipGoal, timeframe, partnershipImpact,
        investmentAction, technologyArea, executiveComment, investmentImpact,
        policyVerb, policyType, policyDetail, policyImpact,
        body,
        related_stocks: [company.id]
      };
    }
  },
  {
    name: 'Product & Innovation',
    templates: [
      { headline: 'Company Event: {company} Launches {productName}, {productDescription} with {keyFeature}', impact: 0.05, importance: 4 },
      { headline: 'Company Event: {company} Receives {approvalType} Approval for {productType}, {marketPotential}', impact: 0.06, importance: 5 },
      { headline: 'Company Event: {company} {researchVerb} Breakthrough in {researchArea}, {potentialUse}', impact: 0.04, importance: 4 },
      { headline: 'Company Event: {company} {competitionVerb} {competitionName} with {productAdvantage}', impact: '{competitionImpact}', importance: 4 },
      { headline: 'Company Event: {company} Reports {percentChange}% {direction} in {metricName} for {productLine} Products', impact: '{metricImpact}', importance: 3 },
      { headline: 'Company Event: {company} Addresses {issueType} Issue with {productName}, {resolutionDetails}', impact: '{issueImpact}', importance: 4 },
      { headline: 'Company Event: {company} {partnerVerb} with {partnerName} to {developmentGoal}', impact: 0.03, importance: 3 },
    ],
    generateDetails: () => {
      const companies = [
        { name: 'TechCorp', id: 1, sector: 'Technology' },
        { name: 'MegaBank', id: 2, sector: 'Finance' },
        { name: 'EnergyFuture', id: 3, sector: 'Energy' },
        { name: 'RetailGiant', id: 4, sector: 'Retail' },
        { name: 'HealthInnovate', id: 5, sector: 'Healthcare' },
        { name: 'GrowthSoftware', id: 6, sector: 'Technology' },
        { name: 'IndustrialPro', id: 7, sector: 'Manufacturing' },
        { name: 'FoodCorp', id: 8, sector: 'Consumer Goods' },
      ];
      
      const company = companies[Math.floor(Math.random() * companies.length)];
      
      // Product names by sector
      const productNamesBySector = {
        'Technology': ['QuantumX Pro', 'CloudMaster 5000', 'SmartConnect', 'IntelliSense AI', 'SecureEdge Platform'],
        'Finance': ['InvestPro Suite', 'SecurePay', 'WealthManager AI', 'TradeSmart Platform', 'DigitalBanking 360'],
        'Energy': ['EcoGenPower', 'SolarMaximizer', 'GridOptimize', 'CleanFuel X', 'SmartEnergy Hub'],
        'Retail': ['ShopStream', 'CustomerConnect', 'RetailInsight', 'MarketPlace+', 'OmniChannel Suite'],
        'Healthcare': ['MediScan Pro', 'LifeMonitor', 'CareConnect', 'DiagnostX', 'TherapeuticPlus'],
        'Manufacturing': ['AutoFab Pro', 'IndustrialIQ', 'PrecisionMaker', 'AssemblyOptimize', 'SmartFactory OS'],
        'Consumer Goods': ['NutriBlend Max', 'EcoClean', 'HomeSmart', 'TasteFullX', 'PureComfort']
      };
      
      const productNames = productNamesBySector[company.sector] || 
        ['NextGen Pro', 'SmartSolution', 'InnovateX', 'PremiumPlus', 'UltraEdge'];
      
      const productName = productNames[Math.floor(Math.random() * productNames.length)];
      
      // Product descriptions
      const productDescriptions = [
        'Revolutionary New Product', 'Next-Generation Solution', 'Industry-First Innovation',
        'Advanced Platform', 'Enhanced Service Offering', 'Breakthrough Technology'
      ];
      const productDescription = productDescriptions[Math.floor(Math.random() * productDescriptions.length)];
      
      // Key features
      const keyFeatures = [
        'AI-Powered Analytics', 'Cloud Integration', 'Enhanced Security Features',
        'Improved User Experience', '50% Performance Gain', 'Sustainable Design',
        'Real-Time Processing', 'Enterprise-Grade Scalability', 'Patented Technology'
      ];
      const keyFeature = keyFeatures[Math.floor(Math.random() * keyFeatures.length)];
      
      // Approval details
      const approvalTypes = ['Regulatory', 'FDA', 'Patent', 'International', 'Industry Certification'];
      const approvalType = approvalTypes[Math.floor(Math.random() * approvalTypes.length)];
      
      const productTypes = {
        'Technology': ['Security System', 'Enterprise Software', 'Cloud Platform', 'Data Analytics Tool'],
        'Finance': ['Payment System', 'Investment Platform', 'Risk Management Tool', 'Digital Banking Solution'],
        'Energy': ['Solar Technology', 'Energy Storage Solution', 'Smart Grid System', 'Renewable Energy System'],
        'Retail': ['E-commerce Platform', 'Inventory Management System', 'Customer Analytics Tool', 'POS System'],
        'Healthcare': ['Diagnostic Device', 'Treatment Protocol', 'Patient Monitoring System', 'Pharmaceutical Product'],
        'Manufacturing': ['Automation Solution', 'Quality Control System', 'Production Software', 'Industrial Equipment'],
        'Consumer Goods': ['Food Product', 'Household Device', 'Personal Care Line', 'Beverage Product']
      };
      
      const sectorProductTypes = productTypes[company.sector] || ['New Product', 'Service Offering', 'Software Solution', 'Consumer Device'];
      const productType = sectorProductTypes[Math.floor(Math.random() * sectorProductTypes.length)];
      
      const marketPotentials = [
        'Opening $5B Market Opportunity', 'Expected to Boost Annual Revenue by 15%',
        'Targeting Growing Customer Segment', 'First-to-Market Advantage',
        'Addressing Unmet Customer Need', 'Significant Competitive Advantage'
      ];
      const marketPotential = marketPotentials[Math.floor(Math.random() * marketPotentials.length)];
      
      // Research details
      const researchVerbs = ['Announces', 'Reports', 'Patents', 'Demonstrates', 'Publishes'];
      const researchVerb = researchVerbs[Math.floor(Math.random() * researchVerbs.length)];
      
      const researchAreas = {
        'Technology': ['Quantum Computing', 'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Edge Computing'],
        'Finance': ['Blockchain Technology', 'Algorithmic Trading', 'Risk Assessment', 'Fraud Detection', 'Payment Processing'],
        'Energy': ['Energy Storage', 'Solar Efficiency', 'Smart Grid Technology', 'Carbon Capture', 'Renewable Integration'],
        'Retail': ['Customer Analytics', 'Supply Chain Optimization', 'E-commerce Infrastructure', 'Inventory Management'],
        'Healthcare': ['Drug Discovery', 'Diagnostic Imaging', 'Gene Therapy', 'Remote Patient Monitoring', 'Surgical Technique'],
        'Manufacturing': ['Advanced Materials', 'Robotics', 'Additive Manufacturing', 'Process Automation', 'Quality Control'],
        'Consumer Goods': ['Food Science', 'Packaging Technology', 'Product Formulation', 'Preservation Technique']
      };
      
      const sectorResearchAreas = researchAreas[company.sector] || ['Technology', 'Production Process', 'Materials Science', 'Customer Experience'];
      const researchArea = sectorResearchAreas[Math.floor(Math.random() * sectorResearchAreas.length)];
      
      const potentialUses = [
        'Could Revolutionize Industry', 'Expected to Launch Within 18 Months',
        'Significant Commercial Applications', 'Patents Pending for Key Components',
        'Potential $1B Market Opportunity', 'Multiple Industry Applications'
      ];
      const potentialUse = potentialUses[Math.floor(Math.random() * potentialUses.length)];
      
      // Competition details
      const competitionVerbs = ['Challenges', 'Outperforms', 'Targets', 'Disrupts', 'Gains Edge Over'];
      const competitionVerb = competitionVerbs[Math.floor(Math.random() * competitionVerbs.length)];
      
      // Filter to get a different company for competition
      const potentialCompetitors = companies.filter(c => c.id !== company.id && c.sector === company.sector);
      const competitionName = potentialCompetitors.length > 0 ? 
        potentialCompetitors[Math.floor(Math.random() * potentialCompetitors.length)].name : 
        'Industry Competitors';
      
      const productAdvantages = [
        '30% Performance Improvement', 'Lower Cost Structure', 'Enhanced Feature Set',
        'Superior User Experience', 'Advanced Technology', 'More Sustainable Approach'
      ];
      const productAdvantage = productAdvantages[Math.floor(Math.random() * productAdvantages.length)];
      
      const competitionImpact = competitionVerb === 'Outperforms' || competitionVerb === 'Gains Edge Over' ? 
        0.05 + Math.random() * 0.03 : 0.03 + Math.random() * 0.02;
      
      // Metrics
      const percentChange = (Math.random() * 30 + 10).toFixed(1);
      const direction = Math.random() > 0.3 ? 'Increase' : 'Decrease';
      
      const metricNames = ['Sales', 'Market Share', 'Customer Adoption', 'Production Volume', 'Efficiency', 'Customer Satisfaction'];
      const metricName = metricNames[Math.floor(Math.random() * metricNames.length)];
      
      const productLines = {
        'Technology': ['Enterprise', 'Consumer', 'Cloud', 'Security', 'Mobile'],
        'Finance': ['Retail Banking', 'Investment', 'Insurance', 'Payment', 'Advisory'],
        'Energy': ['Renewable', 'Traditional', 'Storage', 'Distribution', 'Consumer'],
        'Retail': ['Online', 'In-Store', 'Mobile', 'Premium', 'Value'],
        'Healthcare': ['Diagnostic', 'Therapeutic', 'Monitoring', 'Surgical', 'Consumer'],
        'Manufacturing': ['Industrial', 'Consumer', 'Automotive', 'Electronics', 'Precision'],
        'Consumer Goods': ['Food', 'Beverage', 'Household', 'Personal Care', 'Luxury']
      };
      
      const sectorProductLines = productLines[company.sector] || ['Flagship', 'Entry-Level', 'Premium', 'Core', 'New'];
      const productLine = sectorProductLines[Math.floor(Math.random() * sectorProductLines.length)];
      
      const metricImpact = direction === 'Increase' ? 
        (metricName === 'Sales' || metricName === 'Market Share' || metricName === 'Customer Adoption' || metricName === 'Customer Satisfaction' ? 
          0.04 + Math.random() * 0.03 : 0.02 + Math.random() * 0.02) : 
        -0.03 - Math.random() * 0.03;
      
      // Issues
      const issueTypes = ['Quality', 'Security', 'Performance', 'Compatibility', 'Supply Chain', 'Regulatory'];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      const resolutionDetails = [
        'Software Update Released', 'Comprehensive Fix Implemented', 'Voluntary Recall Announced',
        'Enhanced Version Launched', 'Root Cause Identified', 'Customer Support Program Established'
      ];
      const resolutionDetail = resolutionDetails[Math.floor(Math.random() * resolutionDetails.length)];
      
      const issueImpact = resolutionDetail.includes('Recall') ? 
        -0.05 - Math.random() * 0.02 : 
        (resolutionDetail.includes('Fix') || resolutionDetail.includes('Update') || resolutionDetail.includes('Enhanced')) ? 
        0.02 + Math.random() * 0.02 : -0.02 - Math.random() * 0.02;
      
      // Partnerships
      const partnerVerbs = ['Partners', 'Collaborates', 'Forms Alliance', 'Signs Development Agreement'];
      const partnerVerb = partnerVerbs[Math.floor(Math.random() * partnerVerbs.length)];
      
      // Filter to get a different company for partner
      const potentialPartners = companies.filter(c => c.id !== company.id);
      const partnerName = potentialPartners[Math.floor(Math.random() * potentialPartners.length)].name;
      
      const developmentGoals = [
        'Develop Next-Generation Technology', 'Accelerate Product Innovation',
        'Enter New Market Segment', 'Enhance Product Capabilities',
        'Create Industry Standard', 'Launch Joint Research Initiative'
      ];
      const developmentGoal = developmentGoals[Math.floor(Math.random() * developmentGoals.length)];
      
      // Generate a consistent body paragraph
      const body = `${company.name} (ID: ${company.id}) has made significant progress in its product development and innovation initiatives. This development is expected to strengthen the company's competitive position in the ${company.sector} sector and contribute to long-term growth.`;
      
      return { 
        company: company.name,
        sector: company.sector,
        productName, productDescription, keyFeature,
        approvalType, productType, marketPotential,
        researchVerb, researchArea, potentialUse,
        competitionVerb, competitionName, productAdvantage, competitionImpact,
        percentChange, direction, metricName, productLine, metricImpact,
        issueType, resolutionDetail, issueImpact,
        partnerVerb, partnerName, developmentGoal,
        body,
        related_stocks: [company.id]
      };
    }
  }
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
  
  // Generate stock impact options
  const impactOptions = generateImpactOptions(Number(impact));
  
  // Get the actual impact from the options (the one marked as actual)
  const actualImpactOption = impactOptions.find(option => option.is_actual);
  const actualImpact = actualImpactOption ? actualImpactOption.value : Number(impact);
  
  return {
    headline,
    summary,
    body,
    importance: template.importance,
    price_impact: actualImpact, // Use the actual impact from options
    impact_options: impactOptions,
    ...details
  };
};

/**
 * Generates 5 random price impact options, with one being the actual impact
 * @param {number} actualImpact - The actual price impact 
 * @returns {Array} - Array of impact options with the actual impact included
 */
const generateImpactOptions = (actualImpact) => {
  // Get impact settings from local storage
  const storedMinImpact = localStorage.getItem('eventMinImpact');
  const storedMaxImpact = localStorage.getItem('eventMaxImpact');
  
  // Set default impact range if not found in storage
  const minImpact = (storedMinImpact ? Number(storedMinImpact) : 1) / 100;
  const maxImpact = (storedMaxImpact ? Number(storedMaxImpact) : 7) / 100;
  
  // Function to generate a random impact value
  const generateRandomImpact = () => {
    // Random value between min and max impact
    const magnitude = minImpact + Math.random() * (maxImpact - minImpact);
    // 50% chance of positive or negative
    return magnitude * (Math.random() > 0.5 ? 1 : -1);
  };
  
  // Create array with the actual impact
  const options = [actualImpact];
  
  // Add 4 more random options
  while (options.length < 5) {
    const newImpact = generateRandomImpact();
    
    // Ensure options are unique (within a small margin of error)
    const isDuplicate = options.some(option => 
      Math.abs(option - newImpact) < 0.005 // 0.5% margin
    );
    
    if (!isDuplicate) {
      options.push(newImpact);
    }
  }
  
  // Shuffle the array to randomize the position of the actual impact
  return options.sort(() => Math.random() - 0.5).map(impact => ({
    value: impact,
    formatted: `${impact >= 0 ? '+' : ''}${(impact * 100).toFixed(2)}%`,
    is_actual: Math.abs(impact - actualImpact) < 0.0001 // Mark the actual impact
  }));
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
const dispatchWebSocketEvent = async (event) => {
  // Determine the appropriate event type based on the event
  const wsEventType = event.event_type || 'news_item';
  
  // Create the event payload
  const eventData = {
    type: wsEventType,
    ...event
  };
  
  console.log('Dispatching market event:', eventData);
  
  // NEW: Update stock prices based on the event
  if (['market_event', 'sector_event', 'company_event'].includes(wsEventType)) {
    try {
      // Lazy load stocks data if not already cached
      if (!cachedStocks) {
        console.log('Fetching stocks for the first time...');
        cachedStocks = await getAllStocks();
        console.log(`Cached ${cachedStocks.length} stocks for future events`);
      }
      
      // Update stocks based on this event
      console.log(`Updating stock prices based on ${wsEventType}...`);
      const updatedStocks = await updateStocksFromEvent(wsEventType, eventData, cachedStocks);
      
      // For each updated stock, send a stock_update message
      if (updatedStocks && updatedStocks.length > 0) {
        updatedStocks.forEach(updatedStock => {
          // Create a stock_update message that mimics WebSocket updates
          const stockUpdateMessage = {
            type: 'stock_update',
            stock_id: updatedStock.id,
            symbol: updatedStock.symbol,
            price: updatedStock.new_price,
            change_percentage: updatedStock.change_percentage,
            event_source: wsEventType,
            timestamp: new Date().toISOString()
          };
          
          // Update the cached stock
          const stockIndex = cachedStocks.findIndex(s => s.id === updatedStock.id);
          if (stockIndex !== -1) {
            cachedStocks[stockIndex].current_price = updatedStock.new_price;
          }
          
          // Dispatch the stock update WebSocket message
          setTimeout(() => {
            console.log(`Dispatching price update for ${updatedStock.symbol}: ${updatedStock.previous_price.toFixed(2)} → ${updatedStock.new_price.toFixed(2)}`);
            const stockUpdateEvent = new MessageEvent('message', {
              data: JSON.stringify(stockUpdateMessage)
            });
            window.dispatchEvent(stockUpdateEvent);
          }, Math.random() * 2000); // Stagger updates over 2 seconds for more realistic effect
        });
      }
    } catch (error) {
      console.error('Error updating stock prices from event:', error);
    }
  }
  
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