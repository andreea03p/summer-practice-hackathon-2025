// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Project = require('../models/projectModel');
// Import the “protect” function from authMiddleware
const { protect } = require('../middleware/authMiddleware');

// 1) Configure multer so we can upload .txt files
//    – store them under ./uploads/projects/ with the original filename + timestamp.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Make sure this folder exists: <project_root>/uploads/projects
    cb(null, path.join(__dirname, '..', 'uploads', 'projects'));
  },
  filename: function (req, file, cb) {
    // e.g. myfile-1624928349283.txt
    const timestamp = Date.now();
    const ext = path.extname(file.originalname); // “.txt”
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${base}-${timestamp}${ext}`);
  }
});

// Only accept plain‐text files (text/plain).
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/plain') {
    cb(null, true);
  } else {
    cb(new Error('Only .txt files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // up to 10 MB
});

// ──────────────────────────────────────────────────────────────────────────────
// 2) GET /my-projects → return all projects belonging to req.user
//    (protected by “protect”)
router.get(
  '/my-projects',
  protect,
  async (req, res) => {
    try {
      // req.user was set by protect (decoded from JWT)
      const ownerId = req.user._id;
      const projects = await Project.find({ owner: ownerId })
        .sort({ createdAt: -1 });
      return res.json(projects);
    } catch (err) {
      console.error('Error fetching my-projects:', err);
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
  upload.single('projectFile'),
  async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }
      if (!req.file) {
        // multer would have rejected non‐.txt, but just in case:
        return res.status(400).json({ error: 'Project .txt file is required' });
      }

      const newProject = new Project({
        title,
        description,
        projectFile: req.file.filename, // e.g. “notes-1624928349283.txt”
        owner: req.user._id,
      });

      await newProject.save();
      return res.status(201).json(newProject);
    } catch (err) {
      console.error('Error submitting project:', err);
      return res.status(500).json({ error: 'Failed to submit project' });
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

module.exports = router;
