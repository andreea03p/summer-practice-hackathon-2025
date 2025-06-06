// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Project = require('../models/projectModel');
const Feedback = require('../models/feedbackModel');
// Import the “protect” function from authMiddleware
const { protect } = require('../middleware/authMiddleware');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'projects');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    cb(null, `${base}-${timestamp}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  console.log('Received file:', file.originalname, 'MIME type:', file.mimetype);
  if (file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Only .txt files are allowed. Received: ' + file.mimetype), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Error handling for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    console.error('File upload error:', err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Not authorized. Admin access required.' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 2) GET /my-projects → return all projects belonging to req.user
//    (protected by “protect”)
router.get(
  '/my-projects',
  protect,
  async (req, res) => {
    try {
      // req.user was set by protect (decoded from JWT)
      const projects = await Project.find({ owner: req.user._id })
        .sort({ createdAt: -1 });
      return res.json(projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      return res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// 3) POST /submit → create a new project document, save the file via multer
//    (protected by “protect”)
router.post(
  '/submit',
  protect,
  (req, res, next) => {
    console.log('Received project submission request');
    console.log('Auth user:', req.user);
    console.log('Request body:', req.body);
    next();
  },
  upload.single('projectFile'),
  handleMulterError,
  async (req, res) => {
    try {
      console.log('Processing project submission');
      console.log('File:', req.file);
      console.log('Body:', req.body);

      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Project .txt file is required' });
      }

      const newProject = new Project({
        title,
        description,
        projectFile: req.file.filename,
        owner: req.user._id,
        status: 'pending'
      });

      await newProject.save();
      console.log('Project saved successfully:', newProject);
      return res.status(201).json(newProject);
    } catch (err) {
      console.error('Error in project submission:', err);
      return res.status(500).json({ error: 'Failed to submit project: ' + err.message });
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// 4) POST /update/:id → update an existing project by ID, bump version, save new .txt.
//    (protected by “protect” — only the owner can update)
router.post(
  '/update/:id',
  protect,
  upload.single('projectFile'),
  async (req, res) => {
    try {
      const projectId = req.params.id;
      const existing = await Project.findById(projectId);
      if (!existing) {
        return res.status(404).json({ error: 'Project not found' });
      }
      // Only the owner can update
      if (existing.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized to update this project' });
      }

      // Ensure we got a new .txt file
      if (!req.file) {
        return res.status(400).json({ error: 'Updated .txt file is required to update' });
      }

      // Update fields, bump version, update status
      existing.title = req.body.title || existing.title;
      existing.description = req.body.description || existing.description;
      existing.projectFile = req.file.filename;
      existing.version = existing.version + 1;
      existing.status = 'updated'; // adjust as needed
      await existing.save();

      return res.json(existing);
    } catch (err) {
      console.error('Error updating project:', err);
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Download project file
router.get('/download/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to download this project' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', 'projects', project.projectFile);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Project file not found' });
    }

    res.download(filePath);
  } catch (err) {
    console.error('Error downloading project:', err);
    res.status(500).json({ error: 'Failed to download project' });
  }
});

// Get all projects (admin only)
router.get('/all', protect, requireAdmin, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    return res.json(projects);
  } catch (err) {
    console.error('Error fetching all projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project details with feedback
router.get('/details/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is admin or project owner
    if (req.user.role !== 'admin' && project.owner._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view this project' });
    }

    const feedback = await Feedback.find({ project: project._id })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    return res.json({ project, feedback });
  } catch (err) {
    console.error('Error fetching project details:', err);
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
});

// Review project (admin only)
router.post('/review/:id', protect, requireAdmin, async (req, res) => {
  try {
    const { feedback, status, rating } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Update project status
    project.status = status;
    project.adminFeedback = feedback;
    project.lastReviewedAt = new Date();
    project.lastReviewedBy = req.user._id;

    // Update average rating if rating is provided
    if (rating) {
      const newRatingCount = project.ratingCount + 1;
      const newAverageRating = ((project.averageRating * project.ratingCount) + rating) / newRatingCount;
      project.ratingCount = newRatingCount;
      project.averageRating = newAverageRating;
    }

    await project.save();

    // Create feedback entry
    const newFeedback = new Feedback({
      project: projectId,
      user: req.user._id,
      content: feedback,
      rating: rating,
      isAdminFeedback: true
    });

    await newFeedback.save();

    return res.json({ project, feedback: newFeedback });
  } catch (err) {
    console.error('Error reviewing project:', err);
    return res.status(500).json({ error: 'Failed to review project' });
  }
});

module.exports = router;
