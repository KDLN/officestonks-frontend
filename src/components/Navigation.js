import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, isAdmin } from '../services/auth';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  console.log("Navigation - User is admin:", userIsAdmin);

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