import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getLeaders, getLeadersByConstituency } from '../services/api';
import Card from '../components/Card';

function Leaders() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [constituencies, setConstituencies] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const { constituency } = useParams();

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        let data;
        if (constituency) {
          data = await getLeadersByConstituency(constituency);
          setSelectedConstituency(constituency);
        } else {
          data = await getLeaders();
          
          // Extract unique constituencies
          const uniqueConstituencies = [...new Set(data.map(leader => leader.constituency))];
          setConstituencies(uniqueConstituencies);
        }
        
        setLeaders(data);
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch leaders');
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [constituency]);

  const handleConstituencyChange = async (e) => {
    const newConstituency = e.target.value;
    setSelectedConstituency(newConstituency);
    
    try {
      setLoading(true);
      if (newConstituency) {
        const data = await getLeadersByConstituency(newConstituency);
        setLeaders(data);
      } else {
        const data = await getLeaders();
        setLeaders(data);
      }
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch leaders');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading leaders...</div>;
  }

  return (
    <div className="leaders-page">
      <h1>Election Leaders</h1>
      
      <div className="filter-section">
        <label htmlFor="constituency">Filter by Constituency:</label>
        <select
          id="constituency"
          value={selectedConstituency}
          onChange={handleConstituencyChange}
        >
          <option value="">All Constituencies</option>
          {constituencies.map((c, index) => (
            <option key={index} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      
      {leaders.length === 0 ? (
        <p>No leaders found.</p>
      ) : (
        <div className="leaders-grid">
          {leaders.map((leader) => (
            <Card key={leader._id} className="leader-card">
              <div className="leader-header">
                <h2>{leader.name}</h2>
                <span className="badge badge-primary">{leader.party}</span>
              </div>
              <div className="leader-details">
                <div className="leader-item">
                  <strong>Constituency:</strong> {leader.constituency}
                </div>
                <div className="leader-item">
                  <strong>Manifesto:</strong>
                  <p className="manifesto-text">{leader.manifesto}</p>
                </div>
                <div className="leader-item">
                  <strong>Total Votes:</strong> {leader.votes}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaders; 