import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  getElectionById, 
  getLeadersByConstituency, 
  castVote, 
  deleteElection, 
  registerVoterForElection,
  addCandidateToElection,
  updateElectionStatus,
  removeCandidateFromElection
} from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

function ElectionDetails() {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    voterId: '',
    constituencyName: '',
  });
  const [showCandidateSelection, setShowCandidateSelection] = useState(false);
  const [availableLeaders, setAvailableLeaders] = useState([]);
  const [selectedLeaders, setSelectedLeaders] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchElectionDetails = async () => {
      try {
        const electionData = await getElectionById(id);
        setElection(electionData);
        
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Debug: Log user and constituency information
          console.log('User:', parsedUser);
          
          // If user is a voter, find their constituency in the election
          if (parsedUser.role === 'voter' && parsedUser.constituency) {
            const userConstituency = electionData.constituencies.find(
              c => c.name.toLowerCase() === parsedUser.constituency.toLowerCase()
            );
            
            // Debug: Log constituency information
            console.log('User Constituency:', parsedUser.constituency);
            console.log('Election Constituencies:', electionData.constituencies.map(c => c.name));
            console.log('Matching Constituency:', userConstituency);
            
            if (userConstituency) {
              console.log('Voters in constituency:', userConstituency.voters);
              console.log('User ID:', parsedUser._id);
              console.log('Is user in voters list:', userConstituency.voters.some(
                voterId => voterId.toString() === parsedUser._id.toString()
              ));
              
              // Fetch all leaders for this constituency
              try {
                // First get all leaders for this constituency
                const allLeaders = await getLeadersByConstituency(parsedUser.constituency);
                console.log('All leaders for constituency:', allLeaders);
                console.log('Leaders count:', allLeaders.length);
                
                // Log each leader's details
                allLeaders.forEach((leader, index) => {
                  console.log(`Leader ${index + 1}: ${leader.name}, Party: ${leader.party}, ID: ${leader._id}`);
                });
                
                // Log the candidates in this constituency for this election
                console.log('Candidates in election for this constituency:', userConstituency.candidates);
                console.log('Candidates count:', userConstituency.candidates.length);
                
                // IMPORTANT: Always show all leaders from the constituency
                // This ensures users can see all leaders regardless of candidate registration issues
                console.log('Showing all leaders from constituency regardless of candidate status');
                setCandidates(allLeaders);
                
              } catch (candidateError) {
                console.error('Error fetching candidates:', candidateError);
                toast.error(candidateError.response?.data?.message || 'Failed to fetch candidates for your constituency');
              }
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch election details');
        setLoading(false);
      }
    };

    fetchElectionDetails();
  }, [id]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    if (!user.constituency) {
      toast.error('You do not have a constituency assigned');
      return;
    }

    try {
      setVoting(true);
      
      // Check if the selected leader is already a candidate in the election
      const userConstituency = election.constituencies.find(
        c => c.name.toLowerCase() === user.constituency.toLowerCase()
      );
      
      if (userConstituency) {
        const isCandidate = userConstituency.candidates.some(
          candidateId => candidateId.toString() === selectedCandidate.toString()
        );
        
        // If not already a candidate, register them first
        if (!isCandidate && user.role === 'voter') {
          console.log(`Selected leader is not registered as a candidate. Registering them first...`);
          try {
            // Find the selected leader in the candidates list
            const selectedLeader = candidates.find(c => c._id === selectedCandidate);
            if (selectedLeader) {
              console.log(`Registering ${selectedLeader.name} as a candidate for ${user.constituency}`);
              await addCandidateToElection(election._id, selectedCandidate, user.constituency);
              console.log('Leader successfully registered as a candidate');
            }
          } catch (registerError) {
            console.error('Error registering leader as candidate:', registerError);
            // Continue with the vote anyway
          }
        }
      }
      
      // Cast the vote
      await castVote({
        electionId: id,
        candidateId: selectedCandidate,
      });
      toast.success('Vote cast successfully');
      
      // Update user in localStorage to reflect that they've voted
      const updatedUser = { ...user, hasVoted: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setVoting(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cast vote');
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      try {
        await deleteElection(id);
        toast.success('Election deleted successfully');
        navigate('/elections');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete election');
      }
    }
  };

  const handleEndElection = async () => {
    if (window.confirm('Are you sure you want to end this election now? This will mark it as completed and no more votes can be cast.')) {
      try {
        // Show loading toast
        const loadingToastId = toast.info('Ending election...', { autoClose: false });
        
        // Update election status to completed
        await updateElectionStatus(id, 'completed');
        
        // Refresh election data
        const updatedElection = await getElectionById(id);
        setElection({
          ...updatedElection,
          status: 'completed' // Ensure status is set to completed in the UI
        });
        
        // Close loading toast and show success message
        toast.dismiss(loadingToastId);
        toast.success('Election has been marked as completed');
        
        // Force refresh the page to ensure all components update
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error('Error ending election:', error);
        toast.error(error.response?.data?.message || 'Failed to end election');
      }
    }
  };

  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    
    if (!registerFormData.voterId || !registerFormData.constituencyName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await registerVoterForElection(id, registerFormData);
      toast.success('Voter registered successfully');
      setShowRegisterForm(false);
      setRegisterFormData({ voterId: '', constituencyName: '' });
      
      // Refresh election data
      const electionData = await getElectionById(id);
      setElection(electionData);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register voter');
    }
  };

  const handleRegisterFormChange = (e) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value,
    });
  };

  // Function to add all leaders from a constituency as candidates
  const handleAddAllLeadersAsCandidates = async () => {
    if (!user || user.role !== 'admin' || !election) return;
    
    try {
      console.log('Loading leaders for candidate selection...');
      let allLeaders = [];
      
      // For each constituency in the election
      for (const constituency of election.constituencies) {
        console.log(`Loading leaders for constituency: ${constituency.name}`);
        
        // Get all leaders for this constituency
        const leaders = await getLeadersByConstituency(constituency.name);
        
        // Add constituency information to each leader
        const leadersWithConstituency = leaders.map(leader => ({
          ...leader,
          constituencyName: constituency.name,
          isCandidate: constituency.candidates.some(
            candidateId => candidateId.toString() === leader._id.toString()
          )
        }));
        
        allLeaders = [...allLeaders, ...leadersWithConstituency];
      }
      
      // Initialize selected leaders object
      const initialSelectedLeaders = {};
      allLeaders.forEach(leader => {
        initialSelectedLeaders[leader._id] = leader.isCandidate;
      });
      
      setAvailableLeaders(allLeaders);
      setSelectedLeaders(initialSelectedLeaders);
      setShowCandidateSelection(true);
    } catch (error) {
      console.error('Error loading leaders for candidate selection:', error);
      toast.error(error.response?.data?.message || 'Failed to load leaders');
    }
  };

  // Function to handle leader selection change
  const handleLeaderSelectionChange = (leaderId) => {
    setSelectedLeaders({
      ...selectedLeaders,
      [leaderId]: !selectedLeaders[leaderId]
    });
  };

  // Function to save candidate selections
  const handleSaveCandidateSelections = async () => {
    try {
      console.log('Saving candidate selections...');
      let addedCount = 0;
      let removedCount = 0;
      
      // Process each leader
      for (const leader of availableLeaders) {
        const wasCandidate = leader.isCandidate;
        const isNowCandidate = selectedLeaders[leader._id];
        
        // If status changed
        if (wasCandidate !== isNowCandidate) {
          if (isNowCandidate) {
            // Add as candidate
            await addCandidateToElection(election._id, leader._id, leader.constituencyName);
            addedCount++;
          } else {
            // Remove candidate from election
            await removeCandidateFromElection(election._id, leader._id, leader.constituencyName);
            removedCount++;
          }
        }
      }
      
      // Refresh election data
      const updatedElection = await getElectionById(id);
      setElection(updatedElection);
      
      // Close the selection interface
      setShowCandidateSelection(false);
      
      // Show success message
      if (addedCount > 0 || removedCount > 0) {
        toast.success(`Updated candidates: ${addedCount} added, ${removedCount} removed`);
      } else {
        toast.info('No changes were made to candidates');
      }
    } catch (error) {
      console.error('Error saving candidate selections:', error);
      toast.error(error.response?.data?.message || 'Failed to update candidates');
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div className="loading">Loading election details...</div>;
  }

  if (!election) {
    return <div>Election not found</div>;
  }

  // Check if election is active based on dates
  const isElectionActive = (election) => {
    if (!election) return false;
    
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    
    return now >= startDate && now <= endDate;
  };

  // Check if user is registered to vote
  const isUserRegistered = () => {
    if (!user || !election) return false;
    
    // Admin users don't need to be registered to vote
    if (user.role === 'admin') return true;
    
    // Check if user has a constituency
    if (!user.constituency) return false;
    
    // Find the user's constituency
    const userConstituency = election.constituencies.find(
      c => c.name.toLowerCase() === user.constituency.toLowerCase()
    );
    
    if (!userConstituency) return false;
    
    // Check if user's ID is in the voters array
    // This is tricky because MongoDB ObjectIDs are stored as strings in the frontend
    return userConstituency.voters.some(voterId => {
      // Try different formats of comparison
      return voterId === user._id || 
             voterId.toString() === user._id.toString() ||
             voterId === user._id.toString();
    });
  };

  const canVote = () => {
    if (!user || !election) return false;
    if (user.role !== 'voter') return false;
    
    // Check if election is active
    if (!isElectionActive(election)) return false;
    
    // Check if user has already voted
    if (user.hasVoted) return false;
    
    // Check if user has a constituency
    if (!user.constituency) return false;
    
    // Check if user's constituency is part of the election
    const userConstituency = election.constituencies.find(
      c => c.name.toLowerCase() === user.constituency.toLowerCase()
    );
    
    if (!userConstituency) return false;
    
    // Check if user is registered to vote in this constituency
    const isRegistered = userConstituency.voters.some(
      voterId => voterId.toString() === user._id.toString()
    );
    
    return isRegistered;
  };

  return (
    <div className="election-details-page">
      <div className="election-details-header">
        <h1>{election.title}</h1>
        {user && user.role === 'admin' && (
          <div className="admin-actions">
            <Button 
              onClick={() => setShowRegisterForm(!showRegisterForm)} 
              className="btn-secondary"
            >
              {showRegisterForm ? 'Cancel' : 'Register Voter'}
            </Button>
            <Button 
              onClick={handleAddAllLeadersAsCandidates} 
              className="btn-primary"
            >
              Manage Candidates
            </Button>
            {election.status === 'active' && (
              <Button 
                onClick={handleEndElection} 
                className="btn-warning"
              >
                End Election Now
              </Button>
            )}
            <Button 
              onClick={handleDelete} 
              className="btn-danger"
            >
              Delete Election
            </Button>
          </div>
        )}
        <div className="election-status">
          <span className={`badge badge-${election.status === 'active' ? 'success' : election.status === 'upcoming' ? 'info' : 'secondary'}`}>
            {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
          </span>
        </div>
      </div>
      
      <Card className="election-info">
        <p>{election.description}</p>
        <div className="election-dates">
          <div>
            <strong>Start Date:</strong> {formatDate(election.startDate)}
          </div>
          <div>
            <strong>End Date:</strong> {formatDate(election.endDate)}
          </div>
        </div>
        
        <h3>Constituencies</h3>
        <ul className="constituencies-list">
          {election.constituencies.map((constituency, index) => (
            <li key={index}>{constituency.name}</li>
          ))}
        </ul>
      </Card>

      {/* Admin View: Show all constituencies and their candidates */}
      {user && user.role === 'admin' && (
        <Card title="Election Constituencies and Candidates" className="admin-view">
          {election.constituencies.map((constituency, index) => (
            <div key={index} className="constituency-details">
              <h4>{constituency.name}</h4>
              <div>
                <strong>Candidates:</strong> {constituency.candidates.length}
              </div>
              <div>
                <strong>Registered Voters:</strong> {constituency.voters.length}
              </div>
            </div>
          ))}
        </Card>
      )}

      {canVote() ? (
        <Card title="Cast Your Vote" className="voting-card">
          <p>Select a candidate from your constituency ({user.constituency}) to cast your vote:</p>
          
          {candidates.length > 0 ? (
            <div className="candidates-list">
              {candidates.map((candidate) => (
                <div key={candidate._id} className="candidate-item">
                  <input
                    type="radio"
                    id={candidate._id}
                    name="candidate"
                    value={candidate._id}
                    onChange={() => setSelectedCandidate(candidate._id)}
                    checked={selectedCandidate === candidate._id}
                  />
                  <label htmlFor={candidate._id}>
                    <strong>{candidate.name}</strong> ({candidate.party})
                  </label>
                </div>
              ))}
              
              <button 
                className="btn btn-primary" 
                onClick={handleVote}
                disabled={!selectedCandidate || voting}
              >
                {voting ? 'Submitting...' : 'Cast Vote'}
              </button>
            </div>
          ) : (
            <p className="no-candidates">No candidates found for your constituency. Please contact the election commission.</p>
          )}
        </Card>
      ) : user.hasVoted ? (
        <p>You have already cast your vote in this election.</p>
      ) : !isElectionActive(election) ? (
        <p>
          {new Date() < new Date(election.startDate) 
            ? `Voting has not started yet. Voting begins on ${new Date(election.startDate).toLocaleString()}.` 
            : 'Voting has ended for this election.'}
        </p>
      ) : !isUserRegistered() ? (
        <p className="error-message">
          You are not registered to vote in this election. 
          <br />
          {user.constituency ? (
            <>
              Your constituency: {user.constituency}
              <br />
              Available constituencies: {election.constituencies.map(c => c.name).join(', ')}
            </>
          ) : (
            'You do not have a constituency assigned.'
          )}
        </p>
      ) : (
        <p>You are not eligible to vote in this election.</p>
      )}
      
      {election.status === 'completed' && (
        <Link to={`/results/${election._id}`} className="btn btn-secondary btn-block">
          View Results
        </Link>
      )}

      {/* Admin: Register Voter Form */}
      {user && user.role === 'admin' && showRegisterForm && (
        <Card title="Register Voter" className="register-voter-card">
          <form onSubmit={handleRegisterVoter}>
            <div className="form-group">
              <label htmlFor="voterId">Voter ID</label>
              <input
                type="text"
                id="voterId"
                name="voterId"
                value={registerFormData.voterId}
                onChange={handleRegisterFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="constituencyName">Constituency</label>
              <select
                id="constituencyName"
                name="constituencyName"
                value={registerFormData.constituencyName}
                onChange={handleRegisterFormChange}
                required
              >
                <option value="">Select Constituency</option>
                {election.constituencies.map((constituency, index) => (
                  <option key={index} value={constituency.name}>
                    {constituency.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="btn-primary">
              Register Voter
            </Button>
          </form>
        </Card>
      )}

      {/* Admin: Candidate Selection Interface */}
      {user && user.role === 'admin' && showCandidateSelection && (
        <Card title="Manage Election Candidates" className="candidate-selection-card">
          <p className="selection-instructions">
            Select the leaders who should be candidates in this election. Leaders are automatically added based on their constituency, but you can modify the selection here.
          </p>
          
          {availableLeaders.length === 0 ? (
            <p>No leaders found for the constituencies in this election.</p>
          ) : (
            <>
              <div className="candidate-selection-list">
                <div className="candidate-selection-header">
                  <div className="col-select">Select</div>
                  <div className="col-name">Leader Name</div>
                  <div className="col-party">Party</div>
                  <div className="col-constituency">Constituency</div>
                </div>
                
                {availableLeaders.map((leader) => (
                  <div key={leader._id} className="candidate-selection-item">
                    <div className="col-select">
                      <input
                        type="checkbox"
                        id={`leader-${leader._id}`}
                        checked={selectedLeaders[leader._id] || false}
                        onChange={() => handleLeaderSelectionChange(leader._id)}
                      />
                    </div>
                    <div className="col-name">
                      <label htmlFor={`leader-${leader._id}`}>{leader.name}</label>
                    </div>
                    <div className="col-party">{leader.party}</div>
                    <div className="col-constituency">{leader.constituencyName}</div>
                  </div>
                ))}
              </div>
              
              <div className="candidate-selection-actions">
                <Button 
                  onClick={handleSaveCandidateSelections} 
                  className="btn-primary"
                >
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setShowCandidateSelection(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

export default ElectionDetails; 