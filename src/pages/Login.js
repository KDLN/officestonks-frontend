import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { checkAdminStatus } from '../services/admin';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login the user
      const userData = await login(username, password);
      console.log("Login response data:", userData);

      // Store username explicitly
      localStorage.setItem('username', username);

      // Check if admin status exists in userData
      if (userData && userData.is_admin !== undefined) {
        console.log("Admin status from login response:", userData.is_admin);
        localStorage.setItem('isAdmin', userData.is_admin.toString());
        console.log("Set isAdmin in localStorage to:", userData.is_admin.toString());
      } else {
        console.log("No admin status in login response, checking separately");

        // Fallback to checking admin status separately
        try {
          const isAdmin = await checkAdminStatus();
          console.log("Admin status from separate check:", isAdmin);
          localStorage.setItem('isAdmin', isAdmin.toString());
          console.log("Set isAdmin in localStorage to:", isAdmin.toString());
        } catch (adminError) {
          console.error("Error checking admin status:", adminError);
          // Default to non-admin if check fails
          localStorage.setItem('isAdmin', 'false');
          console.log("Set isAdmin in localStorage to: false (due to error)");
        }
      }

      // Force refresh to update navigation
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to Office Stonks</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;