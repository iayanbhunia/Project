import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logout } from '../services/api';

function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Function to check and update user from localStorage
  const checkUserLoggedIn = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    // Check user on initial load
    checkUserLoggedIn();

    // Create a custom event listener for auth state changes
    const handleStorageChange = () => {
      checkUserLoggedIn();
    };

    // Listen for the custom auth event
    window.addEventListener('authStateChanged', handleStorageChange);

    // Also listen for storage events (in case of multiple tabs)
    window.addEventListener('storage', handleStorageChange);

    return () => {
      // Clean up event listeners
      window.removeEventListener('authStateChanged', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/login');
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authStateChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <h1>Election Commission</h1>
        </Link>
      </div>
      <nav className="nav">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/elections">Elections</Link>
          </li>
          <li>
            <Link to="/results">Election Results</Link>
          </li>
          <li>
            <Link to="/leaders">Leaders</Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin">Admin</Link>
                </li>
              )}
              <li>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header; 