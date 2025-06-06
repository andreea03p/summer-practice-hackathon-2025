import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaMapMarkedAlt, FaBell, FaUser, FaSignOutAlt, FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import './Navbar.css';
import toast from 'react-hot-toast';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/logout', {}, { withCredentials: true });
      logout(); // Clear client-side auth state
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, clear local state
      logout();
      navigate('/login');
      toast.error('Error during logout, but you have been logged out locally');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Project Review System</Link>
      </div>

      <div className="navbar-menu">
        {user?.role === 'admin' ? (
          // Admin navigation
          <>
            <Link to="/admin/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/profile" className="nav-link">
              Profile
            </Link>
          </>
        ) : (
          // Regular user navigation
          <>
            <Link to="/my-projects" className="nav-link">
              My Projects
            </Link>
            <Link to="/submit-project" className="nav-link">
              Submit Project
            </Link>
          </>
        )}
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;