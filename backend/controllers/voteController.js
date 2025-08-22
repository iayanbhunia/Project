const asyncHandler = require('express-async-handler');
const Vote = require('../models/Vote');
const User = require('../models/User');
const Election = require('../models/Election');

// @desc    Cast a vote
// @route   POST /api/votes
// @access  Private
const castVote = asyncHandler(async (req, res) => {
  const { electionId, candidateId } = req.body;

  if (!electionId || !candidateId) {
    res.status(400);
    throw new Error('Please provide election ID and candidate ID');
  }

  // Check if election exists
  const election = await Election.findById(electionId);
  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Check if election is active based on dates
  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);

  if (now < startDate) {
    res.status(400);
    throw new Error('Voting has not started yet for this election');
  }

  if (now > endDate) {
    res.status(400);
    throw new Error('Voting has ended for this election');
  }

  // Update election status if needed
  if (election.status !== 'active') {
    election.status = 'active';
    await election.save();
  }

  // Check if user is a voter
  if (req.user.role !== 'voter') {
    res.status(403);
    throw new Error('Only voters can cast votes');
  }

  // Check if user has already voted in this election
  const existingVote = await Vote.findOne({
    election: electionId,
    voter: req.user._id,
  });

  if (existingVote) {
    res.status(400);
    throw new Error('You have already voted in this election');
  }

  // Check if user's hasVoted flag is true
  if (req.user.hasVoted) {
    res.status(400);
    throw new Error('You have already voted');
  }

  // Check if candidate exists and is a leader
  const candidate = await User.findById(candidateId);
  if (!candidate || candidate.role !== 'leader') {
    res.status(404);
    throw new Error('Candidate not found or not a leader');
  }

  // Check if voter's constituency matches the candidate's constituency
  if (candidate.constituency.toLowerCase() !== req.user.constituency.toLowerCase()) {
    res.status(400);
    throw new Error('You can only vote for candidates in your constituency');
  }

  // Find the constituency in the election
  const constituencyInElection = election.constituencies.find(
    c => c.name.toLowerCase() === req.user.constituency.toLowerCase()
  );

  if (!constituencyInElection) {
    res.status(400);
    throw new Error('Your constituency is not part of this election');
  }

  // Check if voter is registered in this constituency for this election
  let isVoterRegistered = false;
  
  // Try different ways of comparing the IDs
  for (const voterId of constituencyInElection.voters) {
    if (
      voterId.toString() === req.user._id.toString() ||
      voterId === req.user._id.toString() ||
      voterId.toString() === req.user._id
    ) {
      isVoterRegistered = true;
      break;
    }
  }

  if (!isVoterRegistered) {
    console.log('Voter not registered. User ID:', req.user._id);
    console.log('Voters in constituency:', constituencyInElection.voters);
    res.status(400);
    throw new Error('You are not registered to vote in this election');
  }

  // Check if candidate is registered in this constituency for this election
  const isCandidateRegistered = constituencyInElection.candidates.some(
    candidateId => candidateId.toString() === candidate._id.toString()
  );

  if (!isCandidateRegistered) {
    console.log('Candidate not registered for this election. Attempting to register them...');
    
    // Check if candidate's constituency matches voter's constituency
    if (candidate.constituency.toLowerCase() === req.user.constituency.toLowerCase()) {
      // Add candidate to the constituency
      constituencyInElection.candidates.push(candidate._id);
      await election.save();
      console.log(`Candidate ${candidate.name} automatically registered for constituency ${constituencyInElection.name}`);
    } else {
      res.status(400);
      throw new Error('This candidate is not from your constituency');
    }
  }

  // Create vote
  const vote = await Vote.create({
    election: electionId,
    constituency: req.user.constituency,
    voter: req.user._id,
    candidate: candidateId,
  });

  if (vote) {
    // Update candidate's vote count
    await User.findByIdAndUpdate(candidateId, {
      $inc: { votes: 1 },
    });

    // Update user's hasVoted flag
    await User.findByIdAndUpdate(req.user._id, {
      hasVoted: true,
    });

    res.status(201).json({
      message: 'Vote cast successfully',
      vote,
    });
  } else {
    res.status(400);
    throw new Error('Invalid vote data');
  }
});

// @desc    Get vote statistics
// @route   GET /api/votes/stats/:electionId
// @access  Private/Admin
const getVoteStatistics = asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.electionId);
  
  if (!election) {
    res.status(404);
    throw new Error('Election not found');
  }

  // Get total votes for this election
  const totalVotes = await Vote.countDocuments({ election: req.params.electionId });

  // Get votes by constituency
  const constituencies = election.constituencies.map(c => c.name);
  const votesByConstituency = [];

  for (const constituency of constituencies) {
    const count = await Vote.countDocuments({
      election: req.params.electionId,
      constituency,
    });

    votesByConstituency.push({
      constituency,
      votes: count,
    });
  }

  // Get total registered voters
  const totalVoters = await User.countDocuments({ role: 'voter' });

  // Calculate voter turnout
  const voterTurnout = (totalVotes / totalVoters) * 100;

  res.json({
    totalVotes,
    votesByConstituency,
    totalVoters,
    voterTurnout: voterTurnout.toFixed(2) + '%',
  });
});

module.exports = {
  castVote,
  getVoteStatistics,
}; 