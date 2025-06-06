// controllers/projectController.js
const Project = require('../models/projectModel');
const Feedback = require('../models/feedbackModel');
const User = require('../models/userModel');

// Submit new project (expects req.file to be the .txt that multer saved)
const submitProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Project file is required' });
    }

    const project = await Project.create({
      title,
      description,
      owner: userId,
      projectFile: req.file.filename,
      status: 'pending'
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error submitting project' });
  }
};

// Update existing project
const updateProject = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { id: projectId } = req.params;
    const userId = req.user.id;

    const existingProject = await Project.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (existingProject.owner.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this project' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Updated .txt file is required' });
    }

    // Make a new version
    const updatedProject = await Project.create({
      title: title || existingProject.title,
      description: description || existingProject.description,
      owner: userId,
      projectFile: req.file.filename,
      status: 'updated',
      previousVersion: projectId,
      version: existingProject.version + 1
    });

    res.status(201).json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating project' });
  }
};

// Get all projects (admin)
const getAllProjects = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const projects = await Project.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching projects' });
  }
};

// Get logged-in user's projects
const getUserProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user projects' });
  }
};

// Get project details + feedback
const getProjectDetails = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('previousVersion');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (req.user.role !== 'admin' && project.owner._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const feedback = await Feedback.find({ project: projectId })
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    res.json({ project, feedback });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching project details' });
  }
};

// Review project (admin only)
const reviewProject = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { id: projectId } = req.params;
    const { feedback, status } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    project.status = status;
    project.adminFeedback = feedback;
    await project.save();

    // Create a Feedback document (if you store feedback separately)
    await Feedback.create({
      project: projectId,
      user: req.user.id,
      content: feedback,
      isAdminFeedback: true
    });

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error reviewing project' });
  }
};

module.exports = {
  submitProject,
  updateProject,
  getAllProjects,
  getUserProjects,
  getProjectDetails,
  reviewProject
};
