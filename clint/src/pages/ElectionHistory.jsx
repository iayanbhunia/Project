import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElections } from '../services/api';
import Card from '../components/Card';

function ElectionResults() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await getElections();
        // Filter to show only completed elections
        const completedElections = data.filter(election => election.status === 'completed');
        // Sort by end date (most recent first)
        completedElections.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        setElections(completedElections);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch election results');
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading election results...</div>;
  }

  return (
    <div className="election-history-page">
      <h1>Past Election Results</h1>
      
      {elections.length === 0 ? (
        <div className="no-results-message">
          <p>No completed elections found.</p>
          <Link to="/elections" className="btn btn-primary">
            View Current Elections
          </Link>
        </div>
      ) : (
        <div className="election-history-list">
          {elections.map((election) => (
            <Card key={election._id} className="election-history-card">
              <div className="election-history-header">
                <h2>{election.title}</h2>
                <span className="badge badge-secondary">
                  Completed
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
              <Link
                to={`/results/${election._id}`}
                className="btn btn-primary btn-block"
              >
                View Detailed Results
              </Link>
            </Card>
          ))}
        </div>
      )}
      
      <div className="back-to-elections">
        <Link to="/elections" className="btn btn-secondary">
          Back to Current Elections
        </Link>
      </div>
    </div>
  );
}

export default ElectionResults; 