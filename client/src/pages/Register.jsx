// src/pages/Register.jsx
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: '',
  });
  const [isAdminReg, setIsAdminReg] = useState(false);

  const registerUser = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, adminKey } = data;

    if (!name || !email || !password || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }

    try {
      const payload = { name, email, password, confirmPassword };
      if (isAdminReg) payload.adminKey = adminKey;

      const response = await axios.post('/register', payload);
      const resData = response.data;

      if (resData.error) {
        toast.error(resData.error);
      } else {
        toast.success('Registration successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (error) {
      console.error('Axios register error:', error);
      toast.error('Server error. Please try again.');
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Sign Up</h2>
        <form onSubmit={registerUser}>
          <label>Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            required
          />

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

          <label>Confirm Password</label>
          <input
            type="password"
            value={data.confirmPassword}
            onChange={(e) =>
              setData({ ...data, confirmPassword: e.target.value })
            }
            required
          />

          <div className="admin-login-toggle">
            <label>
              <input
                type="checkbox"
                checked={isAdminReg}
                onChange={(e) => setIsAdminReg(e.target.checked)}
              />
              Register as Admin
            </label>
          </div>

          {isAdminReg && (
            <>
              <label>Admin Key</label>
              <input
                type="password"
                value={data.adminKey}
                placeholder="Enter admin key"
                onChange={(e) => setData({ ...data, adminKey: e.target.value })}
                required
              />
            </>
          )}

          <button type="submit">Sign Up</button>
        </form>
        <div className="register-footer">
          <button className="footer-btn" onClick={() => navigate('/login')}>
            Already a user? Login!
          </button>
        </div>
      </div>
    </div>
  );
}
