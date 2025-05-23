import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StockList from './pages/StockList';
import StockDetail from './pages/StockDetail';
import Leaderboard from './pages/Leaderboard';
import Transactions from './pages/Transactions';
import Portfolio from './pages/Portfolio';
import Admin from './pages/Admin';
import AdminUsers from './pages/AdminUsers';
import AdminStocks from './pages/AdminStocks';
import AdminSystemTweaks from './pages/AdminSystemTweaks';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { isAuthenticated } from './services/auth';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated() ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
          <Route path="/stocks" element={<ProtectedRoute element={<StockList />} />} />
          <Route path="/stock/:id" element={<ProtectedRoute element={<StockDetail />} />} />
          <Route path="/portfolio" element={<ProtectedRoute element={<Portfolio />} />} />
          <Route path="/leaderboard" element={<ProtectedRoute element={<Leaderboard />} />} />
          <Route path="/transactions" element={<ProtectedRoute element={<Transactions />} />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute element={<Admin />} />} />
          <Route path="/admin/users" element={<AdminRoute element={<AdminUsers />} />} />
          <Route path="/admin/stocks" element={<AdminRoute element={<AdminStocks />} />} />
          <Route path="/admin/system-tweaks" element={<AdminRoute element={<AdminSystemTweaks />} />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;