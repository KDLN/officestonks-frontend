import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, isAdmin } from '../services/auth';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  console.log("Navigation - User is admin:", userIsAdmin);

  // Force auth check on mount if admin is logged in but not showing
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    const username = localStorage.getItem('username');
    console.log("Navigation useEffect - Admin check:", adminStatus, "Username:", username);

    // Special case for admin user that isn't showing admin status
    if (username === 'admin' && (adminStatus !== 'true' && adminStatus !== '1')) {
      console.log("Admin user detected but status is incorrect, correcting...");
      localStorage.setItem('isAdmin', 'true');
      // Force reload to update navigation
      window.location.reload();
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-logo">
        <Link to="/dashboard">Office Stonks</Link>
      </div>
      <ul className="nav-links">
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/stocks">Stocks</Link>
        </li>
        <li>
          <Link to="/portfolio">Portfolio</Link>
        </li>
        <li>
          <Link to="/leaderboard">Leaderboard</Link>
        </li>
        {userIsAdmin && (
          <li>
            <Link to="/admin" className="admin-link">Admin</Link>
          </li>
        )}
        <li>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;