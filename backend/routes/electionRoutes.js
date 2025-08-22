const express = require('express');
const router = express.Router();
const {
  createElection,
  getElections,
  getElectionById,
  updateElectionStatus,
  addCandidateToConstituency,
  removeCandidateFromConstituency,
  getElectionResults,
  deleteElection,
  registerVoter,
} = require('../controllers/electionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, admin, createElection)
  .get(getElections);

router.route('/:id')
  .get(getElectionById)
  .delete(protect, admin, deleteElection);

router.route('/:id/status')
  .put(protect, admin, updateElectionStatus);

router.route('/:id/candidates')
  .put(protect, admin, addCandidateToConstituency)
  .delete(protect, admin, removeCandidateFromConstituency);

router.route('/:id/register')
  .post(protect, admin, registerVoter);

router.route('/:id/results')
  .get(getElectionResults);

module.exports = router; 