import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../services/auth';

// Component to protect routes that require admin privileges
const AdminRoute = ({ element }) => {
  // Check if user is authenticated and admin
  if (!isAuthenticated()) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // Check if user is admin
  if (!isAdmin()) {
    // Redirect to dashboard if authenticated but not admin
    return <Navigate to="/dashboard" replace />;
  }

  // Render the admin component if authenticated and admin
  return element;
};

export default AdminRoute;