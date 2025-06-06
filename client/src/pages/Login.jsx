import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [data, setData] = useState({
    email: '',
    password: '',
    adminKey: '',
  });
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    const { email, password, adminKey } = data;

    if (!email || !password) {
      toast.error('All fields are required');
      return;
    }

    try {
      const payload = { email, password };
      if (isAdminLogin) {
        payload.adminKey = adminKey;
      }

      const response = await axios.post('/login', payload, {
        withCredentials: true,
      });

      const resData = response.data;
      if (resData.error) {
        toast.error(resData.error);
      } else {
        // Set context.user so that ProtectedRoute can work
        login(resData);
        toast.success('Login successful!');

        if (resData.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/profile');
        }
      }
    } catch (error) {
      console.error('Axios login error:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('An error occurred during login');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={loginUser}>
          <label>Email</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            required
          />

          <div className="admin-login-toggle">
            <label>
              <input
                type="checkbox"
                checked={isAdminLogin}
                onChange={(e) => setIsAdminLogin(e.target.checked)}
              />
              Login as Admin
            </label>
          </div>

          {isAdminLogin && (
            <>
              <label>Admin Key</label>
              <input
                type="password"
                value={data.adminKey}
                placeholder="Enter admin key"
                onChange={(e) =>
                  setData({ ...data, adminKey: e.target.value })
                }
                required
              />
            </>
          )}

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <div className="login-footer">
          <button className="footer-btn" onClick={() => navigate('/register')}>
            Sign Up
          </button>
          <button className="footer-btn" onClick={() => navigate('/reset-pass')}>
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
