import React from 'react';
import './ErrorMessage.css';

/**
 * Error message component for displaying error states
 * 
 * @param {Object} props Component props
 * @param {String} props.message Error message to display
 * @param {Function} props.onRetry Optional retry function
 * @param {String} props.severity Error severity: 'info', 'warning', 'error', or 'critical'
 * @param {Boolean} props.withIcon Whether to show an icon
 */
const ErrorMessage = ({ 
  message = 'An error occurred', 
  onRetry = null,
  severity = 'error',
  withIcon = true
}) => {
  return (
    <div className={`error-container error-${severity}`}>
      {withIcon && <div className="error-icon"></div>}
      <div className="error-content">
        <p className="error-message">{message}</p>
        {onRetry && (
          <button className="error-retry" onClick={onRetry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Wrapper component to conditionally show error state
 * 
 * @param {Object} props Component props
 * @param {Boolean|String} props.error Error state (boolean or error message)
 * @param {React.ReactNode} props.children Children to render when no error
 * @param {Function} props.onRetry Optional retry function
 */
export const ErrorWrapper = ({ error, children, onRetry = null }) => {
  if (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return <ErrorMessage message={errorMessage} onRetry={onRetry} />;
  }

  return children;
};

export default ErrorMessage;