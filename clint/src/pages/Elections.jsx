import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElections, deleteElection } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

function Elections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchElections = async () => {
      try {
        setLoading(true);
        const data = await getElections();
        // Filter to show only active and upcoming elections
        const activeAndUpcomingElections = data.filter(
          election => election.status === 'active' || election.status === 'upcoming'
        );
        setElections(activeAndUpcomingElections);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch elections');
        setLoading(false);
      }
    };

    fetchElections();
  }, [location.key]); // Re-fetch when location changes (navigating back to this page)

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'badge-info';
      case 'active':
        return 'badge-success';
      case 'completed':
        return 'badge-secondary';
      default:
        return 'badge-info';
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      try {
        await deleteElection(id);
        toast.success('Election deleted successfully');
        // Update the elections list
        setElections(elections.filter(election => election._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete election');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading elections...</div>;
  }

  return (
    <div className="elections-page">
      <div className="elections-header">
        <h1>Current & Upcoming Elections</h1>
        {user && user.role === 'admin' && (
          <Link to="/admin" className="btn btn-primary">
            Create Election
          </Link>
        )}
      </div>
      
      {elections.length === 0 ? (
        <p>No active or upcoming elections found.</p>
      ) : (
        <div className="elections-grid">
          {elections.map((election) => (
            <Card key={election._id} className="election-card">
              <div className="election-header">
                <h2>{election.title}</h2>
                <span className={`badge ${getStatusBadgeClass(election.status)}`}>
                  {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                </span>
              </div>
              <p>{election.description}</p>
              <div className="election-dates">
                <div>
                  <strong>Start Date:</strong> {formatDate(election.startDate)}
                </div>
                <div>
                  <strong>End Date:</strong> {formatDate(election.endDate)}
                </div>
              </div>
              <div className="election-constituencies">
                <strong>Constituencies:</strong>{' '}
                {election.constituencies.map((c) => c.name).join(', ')}
              </div>
              <div className="election-actions">
                <Link
                  to={`/elections/${election._id}`}
                  className="btn btn-primary"
                >
                  View Details
                </Link>
                {user && user.role === 'admin' && (
                  <Button
                    onClick={() => handleDelete(election._id)}
                    className="btn-danger"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="view-past-elections">
        <Link to="/results" className="btn btn-secondary">
          View Past Election Results
        </Link>
      </div>
    </div>
  );
}

export default Elections; 