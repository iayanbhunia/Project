const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, constituency, party, manifesto } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Validate role-specific fields
  if (role === 'leader' && (!constituency || !party || !manifesto)) {
    res.status(400);
    throw new Error('Leaders must provide constituency, party, and manifesto');
  }

  if (role === 'voter' && !constituency) {
    res.status(400);
    throw new Error('Voters must provide constituency');
  }

  // Generate voter ID for voters only
  let voterId = undefined; // Use undefined instead of null for non-voters
  if (role === 'voter') {
    // Generate a random 10-digit voter ID
    voterId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }

  // Create user
  const userData = {
    name,
    email,
    password,
    role: role || 'voter',
    constituency,
    party,
    manifesto,
  };
  
  // Only add voterId field if it's a voter
  if (role === 'voter') {
    userData.voterId = voterId;
  }
  
  const user = await User.create(userData);

  if (user) {
    // Set user session
    req.session.userId = user._id;
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      constituency: user.constituency,
      party: user.party,
      voterId: user.voterId,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Register an admin user
// @route   POST /api/users/admin
// @access  Public
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, adminSecretKey } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Verify admin secret key
  const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'ibelogtokdbc';
  if (adminSecretKey !== ADMIN_SECRET_KEY) {
    res.status(401);
    throw new Error('Invalid admin secret key');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create admin user - explicitly omit voterId field
  const user = await User.create({
    name,
    email,
    password,
    role: 'admin',
    // No voterId field for admin
  });

  if (user) {
    // Set user session
    req.session.userId = user._id;
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && user.password === password) { // Simple password check (not secure but simple)
    // Set user session
    req.session.userId = user._id;
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      constituency: user.constituency,
      party: user.party,
      voterId: user.voterId,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear session
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      constituency: user.constituency,
      party: user.party,
      voterId: user.voterId,
      hasVoted: user.hasVoted,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all leaders
// @route   GET /api/users/leaders
// @access  Public
const getLeaders = asyncHandler(async (req, res) => {
  const leaders = await User.find({ role: 'leader' });
  res.json(leaders);
});

// @desc    Get leaders by constituency
// @route   GET /api/users/leaders/:constituency
// @access  Public
const getLeadersByConstituency = asyncHandler(async (req, res) => {
  const leaders = await User.find({ 
    role: 'leader',
    constituency: { $regex: new RegExp(`^${req.params.constituency}$`, 'i') }
  });
  
  res.json(leaders);
});

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  logoutUser,
  getUserProfile,
  getLeaders,
  getLeadersByConstituency,
}; 