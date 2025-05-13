import React from 'react';
import './Loading.css';

/**
 * Loading spinner component to display during data fetching
 * 
 * @param {Object} props Component props
 * @param {String} props.message Optional message to display with the spinner
 * @param {String} props.size Size of the spinner: 'small', 'medium', or 'large'
 */
const Loading = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-container loading-${size}`}>
      <div className="loading-spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

/**
 * Wrapper component to conditionally show loading state
 * 
 * @param {Object} props Component props
 * @param {Boolean} props.loading Whether data is loading
 * @param {React.ReactNode} props.children Children to render when not loading
 * @param {String} props.message Loading message text
 */
export const LoadingWrapper = ({ loading, children, message, size = 'medium' }) => {
  if (loading) {
    return <Loading message={message} size={size} />;
  }

  return children;
};

export default Loading;