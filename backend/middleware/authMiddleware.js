const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Protect routes - simplified version without JWT
const protect = asyncHandler(async (req, res, next) => {
  // Check if user ID is in session
  if (req.session && req.session.userId) {
    try {
      // Get user from session ID
      const user = await User.findById(req.session.userId);
      
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no session');
  }
});

// Admin middleware
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
});

// Leader middleware
const leader = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'leader' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a leader');
  }
});

module.exports = { protect, admin, leader }; 