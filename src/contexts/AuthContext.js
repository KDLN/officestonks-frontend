import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Auth storage utility functions to encapsulate localStorage logic
const authStorage = {
  // Store token in localStorage
  setToken: (token) => localStorage.setItem('token', token),
  
  // Get token from localStorage
  getToken: () => localStorage.getItem('token'),
  
  // Remove token from localStorage
  removeToken: () => localStorage.removeItem('token'),
  
  // Store user ID in localStorage
  setUserId: (userId) => localStorage.setItem('userId', userId),
  
  // Get user ID from localStorage
  getUserId: () => localStorage.getItem('userId'),
  
  // Remove user ID from localStorage
  removeUserId: () => localStorage.removeItem('userId'),
  
  // Store username in localStorage
  setUsername: (username) => localStorage.setItem('username', username),
  
  // Get username from localStorage
  getUsername: () => localStorage.getItem('username'),
  
  // Remove username from localStorage
  removeUsername: () => localStorage.removeItem('username'),
  
  // Store admin status in localStorage
  setIsAdmin: (isAdmin) => localStorage.setItem('isAdmin', String(isAdmin)),
  
  // Get admin status from localStorage
  getIsAdmin: () => {
    const value = localStorage.getItem('isAdmin');
    return value === 'true' || value === '1';
  },
  
  // Remove admin status from localStorage
  removeIsAdmin: () => localStorage.removeItem('isAdmin'),
  
  // Clear all auth data from localStorage
  clearAll: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
  }
};

// Create the context
const AuthContext = createContext(null);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState({
    isAuthenticated: false,
    userId: null,
    username: null,
    isAdmin: false,
    token: null
  });
  
  const navigate = useNavigate();
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const token = authStorage.getToken();
    const userId = authStorage.getUserId();
    const username = authStorage.getUsername();
    const isAdmin = authStorage.getIsAdmin();
    
    if (token) {
      setCurrentUser({
        isAuthenticated: true,
        userId,
        username,
        isAdmin,
        token
      });
    }
  }, []);

  // Login function
  const login = (userData) => {
    const { token, user_id, username, is_admin } = userData;
    
    // Store auth data
    authStorage.setToken(token);
    authStorage.setUserId(user_id);
    
    if (username) {
      authStorage.setUsername(username);
    }
    
    if (is_admin !== undefined) {
      authStorage.setIsAdmin(is_admin);
    }
    
    // Update context state
    setCurrentUser({
      isAuthenticated: true,
      userId: user_id,
      username,
      isAdmin: is_admin === true,
      token
    });
    
    // Redirect to dashboard
    navigate('/dashboard');
  };
  
  // Logout function
  const logout = () => {
    // Clear auth data
    authStorage.clearAll();
    
    // Reset context state
    setCurrentUser({
      isAuthenticated: false,
      userId: null,
      username: null,
      isAdmin: false,
      token: null
    });
    
    // Redirect to login page
    navigate('/login');
  };
  
  // Update admin status
  const updateAdminStatus = (isAdmin) => {
    authStorage.setIsAdmin(isAdmin);
    
    setCurrentUser(prev => ({
      ...prev,
      isAdmin
    }));
  };
  
  // Value to be provided to consumers
  const value = {
    currentUser,
    login,
    logout,
    updateAdminStatus,
    isAuthenticated: currentUser.isAuthenticated,
    isAdmin: currentUser.isAdmin,
    token: currentUser.token,
    userId: currentUser.userId,
    username: currentUser.username
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher order component for auth check
export const withAuth = (Component) => {
  return (props) => {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};