const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  resetPassword,
  logoutUser
} = require('../controllers/authController');

// Auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-pass', resetPassword);
router.post('/logout', logoutUser);

module.exports = router;
