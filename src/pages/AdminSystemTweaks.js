import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import './Admin.css';
import { checkAdminStatus } from '../services/admin';
import { setEventFrequencyRange, setEventImpactRange } from '../services/market-event-generator';

const AdminSystemTweaks = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // System settings
  const [eventFrequency, setEventFrequency] = useState('medium');
  const [eventMinTime, setEventMinTime] = useState(10);
  const [eventMaxTime, setEventMaxTime] = useState(30);
  const [eventImpactMin, setEventImpactMin] = useState(1);
  const [eventImpactMax, setEventImpactMax] = useState(7);
  
  // Load saved impact settings on mount
  useEffect(() => {
    const savedMinImpact = localStorage.getItem('eventMinImpact');
    const savedMaxImpact = localStorage.getItem('eventMaxImpact');
    
    if (savedMinImpact) setEventImpactMin(Number(savedMinImpact));
    if (savedMaxImpact) setEventImpactMax(Number(savedMaxImpact));
  }, []);
  
  // Verify admin access on mount
  useEffect(() => {
    const verifyAdmin = async () => {
      const isAdmin = await checkAdminStatus();
      if (!isAdmin) {
        // Redirect non-admin users
        navigate('/');
      }
    };
    
    verifyAdmin();
  }, [navigate]);
  
  // Update event frequency settings
  const handleEventFrequencyChange = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // Convert minutes to milliseconds
      const minMs = eventMinTime * 1000;
      const maxMs = eventMaxTime * 1000;
      
      // Validate inputs
      if (minMs > maxMs) {
        throw new Error('Minimum time must be less than maximum time');
      }
      
      if (minMs < 5000) {
        throw new Error('Minimum time cannot be less than 5 seconds');
      }
      
      if (maxMs > 120000) {
        throw new Error('Maximum time cannot be more than 120 seconds');
      }
      
      // Apply the settings
      setEventFrequencyRange(minMs, maxMs);
      
      // Store settings in localStorage for persistence
      localStorage.setItem('eventFrequencyMin', minMs.toString());
      localStorage.setItem('eventFrequencyMax', maxMs.toString());
      
      setMessage(`Market event frequency set to ${eventMinTime}-${eventMaxTime} seconds`);
      console.log(`Admin updated market event frequency to ${minMs}-${maxMs}ms`);
    } catch (err) {
      console.error('Admin UI: Set event frequency error:', err);
      setError(`Failed to set event frequency: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle preset frequency selection
  const handlePresetSelection = (preset) => {
    setEventFrequency(preset);
    
    switch (preset) {
      case 'slow':
        setEventMinTime(25);
        setEventMaxTime(60);
        break;
      case 'medium':
        setEventMinTime(10);
        setEventMaxTime(30);
        break;
      case 'fast':
        setEventMinTime(5);
        setEventMaxTime(15);
        break;
      default:
        // Custom - do nothing
        break;
    }
  };
  
  // Update event impact settings
  const handleEventImpactChange = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      // Validate inputs
      if (eventImpactMin > eventImpactMax) {
        throw new Error('Minimum impact must be less than maximum impact');
      }
      
      if (eventImpactMin < 0.1) {
        throw new Error('Minimum impact cannot be less than 0.1%');
      }
      
      if (eventImpactMax > 15) {
        throw new Error('Maximum impact cannot be more than 15%');
      }
      
      // Apply the settings
      setEventImpactRange(eventImpactMin, eventImpactMax);
      
      // Store settings in localStorage for persistence
      localStorage.setItem('eventMinImpact', eventImpactMin.toString());
      localStorage.setItem('eventMaxImpact', eventImpactMax.toString());
      
      setMessage(`Market event impact range set to ${eventImpactMin}%-${eventImpactMax}%`);
      console.log(`Admin updated market event impact range to ${eventImpactMin}%-${eventImpactMax}%`);
    } catch (err) {
      console.error('Admin UI: Set event impact error:', err);
      setError(`Failed to set event impact: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="admin-page">
      <Navigation />
      <div className="admin-container">
        <h1>System Tweaks</h1>
        
        <div className="admin-navigation">
          <Link to="/admin" className="admin-nav-button">
            ← Back to Admin Dashboard
          </Link>
        </div>
        
        <div className="debug-mode-banner">
          <p>🔧 Admin System Tweaks</p>
          <p>These settings affect the entire system. Use with caution.</p>
        </div>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="admin-actions">
          <div className="admin-card">
            <h2>Market Event Generator</h2>
            <p>Control the frequency and impact of market events</p>
            
            <div className="setting-group">
              <label>Frequency Preset:</label>
              <div className="preset-buttons">
                <button 
                  className={`preset-button ${eventFrequency === 'slow' ? 'active' : ''}`}
                  onClick={() => handlePresetSelection('slow')}
                >
                  Slow
                </button>
                <button 
                  className={`preset-button ${eventFrequency === 'medium' ? 'active' : ''}`}
                  onClick={() => handlePresetSelection('medium')}
                >
                  Medium
                </button>
                <button 
                  className={`preset-button ${eventFrequency === 'fast' ? 'active' : ''}`}
                  onClick={() => handlePresetSelection('fast')}
                >
                  Fast
                </button>
                <button 
                  className={`preset-button ${eventFrequency === 'custom' ? 'active' : ''}`}
                  onClick={() => setEventFrequency('custom')}
                >
                  Custom
                </button>
              </div>
            </div>
            
            <div className="setting-group">
              <label>Event Frequency Range (seconds):</label>
              <div className="range-inputs">
                <div className="input-with-label">
                  <span>Min:</span>
                  <input 
                    type="number" 
                    value={eventMinTime}
                    onChange={(e) => {
                      setEventMinTime(Number(e.target.value));
                      setEventFrequency('custom');
                    }}
                    min="5"
                    max="120"
                  />
                </div>
                <div className="input-with-label">
                  <span>Max:</span>
                  <input 
                    type="number" 
                    value={eventMaxTime}
                    onChange={(e) => {
                      setEventMaxTime(Number(e.target.value));
                      setEventFrequency('custom');
                    }}
                    min="5"
                    max="120"
                  />
                </div>
              </div>
            </div>
            
            <div className="setting-group">
              <label>Event Impact Range (%):</label>
              <div className="range-inputs">
                <div className="input-with-label">
                  <span>Min:</span>
                  <input 
                    type="number" 
                    value={eventImpactMin}
                    onChange={(e) => setEventImpactMin(Number(e.target.value))}
                    min="0.1"
                    max="15"
                    step="0.1"
                  />
                </div>
                <div className="input-with-label">
                  <span>Max:</span>
                  <input 
                    type="number" 
                    value={eventImpactMax}
                    onChange={(e) => setEventImpactMax(Number(e.target.value))}
                    min="0.1"
                    max="15"
                    step="0.1"
                  />
                </div>
              </div>
              <button 
                className="admin-button small"
                onClick={handleEventImpactChange}
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                Apply Impact Settings
              </button>
            </div>
            
            <button 
              className="admin-button"
              onClick={handleEventFrequencyChange}
              disabled={loading}
            >
              {loading ? 'Applying...' : 'Apply Settings'}
            </button>
          </div>
          
          {/* Future system tweak cards can be added here */}
        </div>
      </div>
    </div>
  );
};

export default AdminSystemTweaks;