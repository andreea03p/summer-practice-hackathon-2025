const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const {
    submitProject,
    updateProject,
    getAllProjects,
    getUserProjects,
    getProjectDetails,
    reviewProject
} = require('../controllers/projectController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/projects');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept only zip files
        if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Protected routes (require authentication)
router.use(protect);

// Project routes
router.post('/submit', upload.single('projectFile'), submitProject);
router.post('/update/:projectId', upload.single('projectFile'), updateProject);
router.get('/my-projects', getUserProjects);
router.get('/details/:projectId', getProjectDetails);

// Admin only routes
router.get('/all', getAllProjects);
router.post('/review/:projectId', reviewProject);

module.exports = router; 