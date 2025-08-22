const express = require('express');
const router = express.Router();
const {
  castVote,
  getVoteStatistics,
} = require('../controllers/voteController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, castVote);
router.get('/stats/:electionId', protect, admin, getVoteStatistics);

module.exports = router; 