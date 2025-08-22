import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await login(formData);
      toast.success('Login successful');
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('authStateChanged'));
      
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card title="Login to Your Account" className="login-card">
        <form onSubmit={handleSubmit}>
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
          <Button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Login; 