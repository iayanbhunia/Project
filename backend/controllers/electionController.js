const asyncHandler = require('express-async-handler');
const Election = require('../models/Election');
const User = require('../models/User');
const Vote = require('../models/Vote');

// @desc    Create a new election
// @route   POST /api/elections
// @access  Private/Admin
const createElection = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, constituencies } = req.body;

  if (!title || !description || !startDate || !endDate || !constituencies) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Process constituencies and automatically add leaders
  const processedConstituencies = [];
  
  for (const constituency of constituencies) {
    // Normalize constituency name (trim and convert to title case)
    const constituencyName = constituency.name.trim();
    
    // Find all leaders in this constituency (case-insensitive search)
    const constituencyLeaders = await User.find({
      role: 'leader',
      constituency: { $regex: new RegExp(`^${constituencyName}$`, 'i') }
    });
    
    // Log the leaders found for this constituency
    console.log(`Found ${constituencyLeaders.length} leaders for constituency ${constituencyName}:`);
    constituencyLeaders.forEach(leader => {
      console.log(`- ${leader.name} (${leader.party}): ${leader._id}`);
    });
    
    // Add leaders as candidates
    const candidateIds = constituencyLeaders.map(leader => leader._id);
    
    // Find all voters in this constituency (case-insensitive search)
    const constituencyVoters = await User.find({
      role: 'voter',
      constituency: { $regex: new RegExp(`^${constituencyName}$`, 'i') }
    });
    
    // Add voters to the constituency
    const voterIds = constituencyVoters.map(voter => voter._id);
    
    console.log(`Constituency: ${constituencyName}`);
    console.log(`Found ${constituencyLeaders.length} leaders and ${constituencyVoters.length} voters`);
    console.log('Voter IDs:', voterIds);
    console.log('Candidate IDs:', candidateIds);
    
    // Add to processed constituencies
    processedConstituencies.push({
      name: constituencyName,
      candidates: candidateIds,
      voters: voterIds
    });
  }

  // Create election with processed constituencies
  const election = await Election.create({
    title,
    description,
    startDate,
    endDate,
    constituencies: processedConstituencies,
    createdBy: req.user._id,
  });

  if (election) {
    res.status(201).json(election);
  } else {
    res.status(400);
    throw new Error('Invalid election data');
  }
});

// @desc    Get all elections
// @route   GET /api/elections
// @access  Public
const getElections = asyncHandler(async (req, res) => {
  const elections = await Election.find({}).sort({ createdAt: -1 });
  
  // Check and update status for all elections
  for (const election of elections) {
    // Skip elections that have been manually completed
    if (election.manuallyCompleted && election.status === 'completed') {
      continue;
    }
    
    const currentStatus = determineElectionStatus(election);
    if (election.status !== currentStatus) {
      election.status = currentStatus;
      await election.save();
      console.log(`Updated election ${election._id} status to ${currentStatus}`);
    }
  }
  
  res.json(elections);
});

// Helper function to determine election status based on dates
const determineElectionStatus = (election) => {
  // If election was manually completed, don't change its status
  if (election.manuallyCompleted && election.status === 'completed') {
    return 'completed';
  }

  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);

  if (now < startDate) {
    return 'upcoming';
  } else if (now >= startDate && now <= endDate) {
    return 'active';
  } else {
    return 'completed';
  }
};

// @desc    Get election by ID
// @route   GET /api/elections/:id
// @access  Public
const getElectionById = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Check and update election status based on current date
  // Only if it hasn't been manually completed
  if (!election.manuallyCompleted) {
    const currentStatus = determineElectionStatus(election);
    
    // If status has changed, update it in the database
    if (election.status !== currentStatus) {
      election.status = currentStatus;
      await election.save();
      console.log(`Updated election ${election._id} status to ${currentStatus}`);
    }
  }

  res.json(election);
});

// @desc    Update election status
// @route   PUT /api/elections/:id/status
// @access  Private/Admin
const updateElectionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['upcoming', 'active', 'completed'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status');
  }

  const election = await Election.findById(req.params.id);

  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // If manually setting to completed, also set a flag to prevent automatic status updates
  if (status === 'completed') {
    election.manuallyCompleted = true;
    console.log(`Election ${election._id} manually marked as completed`);
  }

  election.status = status;
  const updatedElection = await election.save();

  // Log the update
  console.log(`Election ${election._id} status updated to ${status}`);

  res.json(updatedElection);
});

// @desc    Add candidate to constituency
// @route   PUT /api/elections/:id/candidates
// @access  Private/Admin
const addCandidateToConstituency = asyncHandler(async (req, res) => {
  const { candidateId, constituencyName } = req.body;

  if (!candidateId || !constituencyName) {
    res.status(400);
    throw new Error('Please provide candidate ID and constituency name');
  }

  const election = await Election.findById(req.params.id);
  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  const candidate = await User.findById(candidateId);
  if (!candidate || candidate.role !== 'leader') {
    res.status(404);
    throw new Error('Candidate not found or not a leader');
  }

  // Find the constituency (case-insensitive)
  const constituencyIndex = election.constituencies.findIndex(
    c => c.name.toLowerCase() === constituencyName.toLowerCase()
  );

  if (constituencyIndex === -1) {
    res.status(404);
    throw new Error('Constituency not found');
  }

  // Check if candidate's constituency matches (case-insensitive)
  if (candidate.constituency.toLowerCase() !== constituencyName.toLowerCase()) {
    res.status(400);
    throw new Error('Candidate must belong to the specified constituency');
  }

  // Check if candidate is already in the constituency
  if (election.constituencies[constituencyIndex].candidates.some(
    id => id.toString() === candidateId.toString()
  )) {
    res.status(400);
    throw new Error('Candidate already added to this constituency');
  }

  // Add candidate to constituency
  election.constituencies[constituencyIndex].candidates.push(candidateId);
  await election.save();

  res.json(election);
});

// @desc    Remove candidate from constituency
// @route   DELETE /api/elections/:id/candidates
// @access  Private/Admin
const removeCandidateFromConstituency = asyncHandler(async (req, res) => {
  const { candidateId, constituencyName } = req.body;

  if (!candidateId || !constituencyName) {
    res.status(400);
    throw new Error('Please provide candidate ID and constituency name');
  }

  const election = await Election.findById(req.params.id);
  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Find the constituency (case-insensitive)
  const constituencyIndex = election.constituencies.findIndex(
    c => c.name.toLowerCase() === constituencyName.toLowerCase()
  );

  if (constituencyIndex === -1) {
    res.status(404);
    throw new Error('Constituency not found');
  }

  // Check if candidate is in the constituency
  const candidateIndex = election.constituencies[constituencyIndex].candidates.findIndex(
    id => id.toString() === candidateId.toString()
  );

  if (candidateIndex === -1) {
    res.status(400);
    throw new Error('Candidate is not registered for this constituency');
  }

  // Remove candidate from constituency
  election.constituencies[constituencyIndex].candidates.splice(candidateIndex, 1);
  await election.save();

  res.json(election);
});

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Public
const getElectionResults = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Allow results for all elections, but warn if not completed
  const results = [];

  // For each constituency, get the candidates and their votes
  for (const constituency of election.constituencies) {
    const candidates = await User.find({
      _id: { $in: constituency.candidates },
    }).select('name party votes');

    results.push({
      constituency: constituency.name,
      candidates: candidates.sort((a, b) => b.votes - a.votes),
    });
  }

  // Include election status in response
  res.json({
    status: election.status,
    results: results
  });
});

// @desc    Delete an election
// @route   DELETE /api/elections/:id
// @access  Private/Admin
const deleteElection = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);

  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Delete all votes associated with this election
  await Vote.deleteMany({ election: req.params.id });

  // Delete the election
  await Election.findByIdAndDelete(req.params.id);

  res.json({ message: 'Election removed' });
});

// @desc    Register a voter for an election
// @route   POST /api/elections/:id/register
// @access  Private/Admin
const registerVoter = asyncHandler(async (req, res) => {
  const { voterId, constituencyName } = req.body;

  if (!voterId || !constituencyName) {
    res.status(400);
    throw new Error('Please provide voter ID and constituency name');
  }

  const election = await Election.findById(req.params.id);
  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Find the voter
  const voter = await User.findOne({ _id: voterId, role: 'voter' });
  if (!voter) {
    res.status(404);
    throw new Error('Voter not found');
  }

  // Find the constituency (case-insensitive)
  const constituencyIndex = election.constituencies.findIndex(
    c => c.name.toLowerCase() === constituencyName.toLowerCase()
  );

  if (constituencyIndex === -1) {
    res.status(404);
    throw new Error('Constituency not found');
  }

  // Check if voter is already registered
  const isAlreadyRegistered = election.constituencies[constituencyIndex].voters.some(
    id => id.toString() === voter._id.toString()
  );

  if (isAlreadyRegistered) {
    res.status(400);
    throw new Error('Voter is already registered for this constituency');
  }

  // Add voter to constituency
  election.constituencies[constituencyIndex].voters.push(voter._id);
  await election.save();

  res.json({
    message: `Voter ${voter.name} registered for ${constituencyName} constituency`,
    election
  });
});

module.exports = {
  createElection,
  getElections,
  getElectionById,
  updateElectionStatus,
  addCandidateToConstituency,
  removeCandidateFromConstituency,
  getElectionResults,
  deleteElection,
  registerVoter,
}; 