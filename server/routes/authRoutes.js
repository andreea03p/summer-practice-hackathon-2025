const express = require('express');
const router = express.Router();
const cors = require('cors');

const {
  registerUser,
  loginUser,
  resetPassword,
} = require('../controllers/authController');

router.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-pass', resetPassword);

module.exports = router;
