import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../utils/http';

/**
 * Custom hook for data fetching with loading, error, and refresh handling
 * 
 * @param {String} url API endpoint URL
 * @param {Object} options Fetch options
 * @param {Boolean} immediate Whether to fetch immediately on mount
 */
const useFetch = (url, options = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  // Function to manually refresh the data
  const refresh = useCallback(() => {
    setRefreshIndex(prevIndex => prevIndex + 1);
  }, []);

  // Function to reset the state
  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Main fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth(url, options);
      setData(response);
      return response;
    } catch (err) {
      setError(err.message || 'An error occurred while fetching data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  // Execute the fetch on mount and when dependencies change
  useEffect(() => {
    if (immediate) {
      fetchData().catch(err => {
        console.error(`Error fetching ${url}:`, err);
      });
    }
  }, [immediate, refreshIndex, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    reset,
    fetch: fetchData
  };
};

export default useFetch;