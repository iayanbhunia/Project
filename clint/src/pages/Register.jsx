import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'voter',
    constituency: '',
    party: '',
    manifesto: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const {
    name,
    email,
    password,
    confirmPassword,
    role,
    constituency,
    party,
    manifesto,
  } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!name || !email || !password || !constituency) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate leader-specific fields
    if (role === 'leader' && (!party || !manifesto)) {
      toast.error('Leaders must provide party and manifesto');
      return;
    }

    try {
      setLoading(true);
      // Remove confirmPassword before sending to API
      const userData = { ...formData };
      delete userData.confirmPassword;
      
      await register(userData);
      toast.success('Registration successful');
      
      // Dispatch custom event to notify Header component
      window.dispatchEvent(new Event('authStateChanged'));
      
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Card title="Create an Account" className="register-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="role">Register as</label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={handleChange}
            >
              <option value="voter">Voter</option>
              <option value="leader">Leader</option>
            </select>
          </div>

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
            <label htmlFor="constituency">Constituency</label>
            <input
              type="text"
              id="constituency"
              name="constituency"
              value={constituency}
              onChange={handleChange}
              placeholder="Enter your constituency"
              required
            />
          </div>

          {role === 'leader' && (
            <>
              <div className="form-group">
                <label htmlFor="party">Political Party</label>
                <input
                  type="text"
                  id="party"
                  name="party"
                  value={party}
                  onChange={handleChange}
                  placeholder="Enter your political party"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="manifesto">Manifesto</label>
                <textarea
                  id="manifesto"
                  name="manifesto"
                  value={manifesto}
                  onChange={handleChange}
                  placeholder="Enter your manifesto"
                  required
                />
              </div>
            </>
          )}

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

          <Button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login here</Link>
          </p>
          <p>
            Register as an admin?{' '}
            <Link to="/admin-register">Admin Registration</Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default Register; 