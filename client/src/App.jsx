// src/App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import MyProjects from './pages/MyProjects';
import ResetPassword from './pages/ResetPassword.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5050';
axios.defaults.withCredentials = true;

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();

  const pathsWithoutNavbar = ['/login', '/register', '/reset-pass'];
  const shouldShowNavbar = user && !pathsWithoutNavbar.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Toaster position="bottom-right" toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-pass" element={<ResetPassword />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-projects"
          element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
