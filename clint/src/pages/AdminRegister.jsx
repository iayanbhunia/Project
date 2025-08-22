import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from '../components/Card';
import Button from '../components/Button';

// Define admin secret key as a constant
const ADMIN_SECRET_KEY = 'ibelogtokdbc';

function AdminRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecretKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, confirmPassword, adminSecretKey } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!name || !email || !password || !adminSecretKey) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Verify admin secret key on client side for better UX
    if (adminSecretKey !== ADMIN_SECRET_KEY) {
      toast.error('Invalid admin secret key');
      return;
    }

    try {
      setLoading(true);
      // Remove confirmPassword before sending to API
      const userData = { ...formData };
      delete userData.confirmPassword;
      
      // Use axios directly to avoid updating localStorage before checking response
      const response = await axios.post('http://localhost:5000/api/users/admin', userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // If successful, update localStorage
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        // Dispatch custom event to notify Header component
        window.dispatchEvent(new Event('authStateChanged'));
      }
      
      toast.success('Admin registration successful');
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Card title="Register as Admin" className="register-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="adminSecretKey">Admin Secret Key</label>
            <div className="password-input-container">
              <input
                type={showSecretKey ? "text" : "password"}
                id="adminSecretKey"
                name="adminSecretKey"
                value={adminSecretKey}
                onChange={handleChange}
                placeholder="Enter the admin secret key"
                required
              />
              <button 
                type="button" 
                className="password-toggle-btn"
                onClick={toggleSecretKeyVisibility}
              >
                {showSecretKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="form-text">
              Contact the system administrator to get the secret key
            </small>
          </div>

          <Button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register as Admin'}
          </Button>
        </form>
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login here</Link>
          </p>
          <p>
            Register as a voter or leader?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AdminRegister; 