// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const User = require('./models/userModel');
const projectRoutes = require('./routes/projectRoutes');
const Feedback = require('./models/feedbackModel');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'projects');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection with detailed logging
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Log the database name
    console.log('Connected to database:', mongoose.connection.db.databaseName);
    
    // Check if feedbacks collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const feedbacksExists = collections.some(col => col.name === 'feedbacks');
    console.log('Feedbacks collection exists:', feedbacksExists);
    
    // Count existing feedbacks
    const feedbackCount = await Feedback.countDocuments();
    console.log('Number of feedbacks in database:', feedbackCount);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Log all database operations
mongoose.set('debug', true);

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.get('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.json({ success: false });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error('Error in /profile:', error);
    return res.json({ success: false });
  }
});

app.use('/', authRoutes);

app.use('/projects', projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
