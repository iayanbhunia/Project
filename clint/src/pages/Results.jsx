import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getElectionById, getElectionResults } from '../services/api';
import Card from '../components/Card';

function Results() {
  const [election, setElection] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetch election details
        const electionData = await getElectionById(id);
        setElection(electionData);
        
        // Get results
        const response = await getElectionResults(id);
        
        // Check if election is not completed
        if (response.status !== 'completed') {
          toast.info('Note: This election is not yet completed. Results may change.');
        }
        
        setResults(response.results);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]);

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (!election) {
    return <div>Election not found</div>;
  }

  if (election.status !== 'completed') {
    return (
      <div className="results-page">
        <h1>Election Results: {election.title}</h1>
        <Card className="results-info">
          <p>Results are only available for completed elections.</p>
          <Link to={`/elections/${id}`} className="btn btn-primary">
            Back to Election
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="results-page">
      <h1>Election Results: {election.title}</h1>
      
      {results.length === 0 ? (
        <p>No results available.</p>
      ) : (
        <div className="results-container">
          {results.map((constituencyResult, index) => (
            <Card 
              key={index} 
              title={`${constituencyResult.constituency} Constituency`}
              className="constituency-results"
            >
              {constituencyResult.candidates.length === 0 ? (
                <p>No candidates in this constituency.</p>
              ) : (
                <div className="candidates-results">
                  <div className="results-header">
                    <div className="col-rank">#</div>
                    <div className="col-name">Candidate</div>
                    <div className="col-party">Party</div>
                    <div className="col-votes">Votes</div>
                    <div className="col-winner">Status</div>
                  </div>
                  
                  {constituencyResult.candidates.map((candidate, candidateIndex) => (
                    <div 
                      key={candidate._id} 
                      className={`result-row ${candidateIndex === 0 ? 'winner' : ''}`}
                    >
                      <div className="col-rank">{candidateIndex + 1}</div>
                      <div className="col-name">{candidate.name}</div>
                      <div className="col-party">{candidate.party}</div>
                      <div className="col-votes">{candidate.votes}</div>
                      <div className="col-winner">
                        {candidateIndex === 0 && (
                          <div className="winner-badge">Winner</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      
      <Link to="/elections" className="btn btn-secondary">
        Back to Elections
      </Link>
    </div>
  );
}

export default Results; 