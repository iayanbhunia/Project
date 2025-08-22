const express = require('express');
const router = express.Router();
const {
  registerUser,
  registerAdmin,
  loginUser,
  logoutUser,
  getUserProfile,
  getLeaders,
  getLeadersByConstituency,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/admin', registerAdmin);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/leaders', getLeaders);
router.get('/leaders/:constituency', getLeadersByConstituency);

module.exports = router; 