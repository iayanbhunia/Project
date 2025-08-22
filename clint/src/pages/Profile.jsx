import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getProfile } from '../services/api';
import Card from '../components/Card';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check if user is logged in
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          navigate('/login');
          return;
        }

        // Fetch user profile
        const userData = await getProfile();
        setUser(userData);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch profile');
        setLoading(false);
        // If unauthorized, redirect to login
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      
      {user && (
        <Card className="profile-card">
          <div className="profile-header">
            <h2>{user.name}</h2>
            <span className="badge badge-primary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
          </div>
          
          <div className="profile-details">
            <div className="profile-item">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="profile-item">
              <strong>Constituency:</strong> {user.constituency}
            </div>
            
            {user.role === 'voter' && (
              <div className="profile-item">
                <strong>Voter ID:</strong> {user.voterId}
              </div>
            )}
            
            {user.role === 'voter' && (
              <div className="profile-item">
                <strong>Voting Status:</strong>{' '}
                <span className={`badge ${user.hasVoted ? 'badge-success' : 'badge-warning'}`}>
                  {user.hasVoted ? 'Voted' : 'Not Voted'}
                </span>
              </div>
            )}
            
            {user.role === 'leader' && (
              <>
                <div className="profile-item">
                  <strong>Party:</strong> {user.party}
                </div>
                <div className="profile-item">
                  <strong>Manifesto:</strong>
                  <p className="manifesto-text">{user.manifesto}</p>
                </div>
                <div className="profile-item">
                  <strong>Total Votes Received:</strong> {user.votes}
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Profile; 