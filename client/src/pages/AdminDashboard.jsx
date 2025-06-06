import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('reviewed');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects/all');
      setProjects(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching projects');
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const response = await axios.get(`/api/projects/details/${projectId}`);
      setSelectedProject(response.data.project);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching project details');
    }
  };

  const handleReview = async () => {
    if (!selectedProject) return;

    try {
      await axios.post(`/api/projects/review/${selectedProject._id}`, {
        feedback,
        status
      });
      
      toast.success('Review submitted successfully');
      setFeedback('');
      setSelectedProject(null);
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error(error);
      toast.error('Error submitting review');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'reviewed':
        return 'status-reviewed';
      case 'updated':
        return 'status-updated';
      default:
        return '';
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="projects-list">
        <h2>Projects to Review</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project._id}
              className={`project-card ${selectedProject?._id === project._id ? 'selected' : ''}`}
              onClick={() => handleProjectClick(project._id)}
            >
              <h3>{project.title}</h3>
              <p className="project-meta">
                By: {project.user.name}
                <span className={`status-badge ${getStatusBadgeClass(project.status)}`}>
                  {project.status}
                </span>
              </p>
              <p className="project-date">
                Submitted: {new Date(project.createdAt).toLocaleDateString()}
              </p>
              {project.version > 1 && (
                <p className="project-version">Version: {project.version}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="project-review">
          <h2>Review Project</h2>
          <div className="project-details">
            <h3>{selectedProject.title}</h3>
            <p>{selectedProject.description}</p>
            <div className="project-actions">
              <a
                href={`/uploads/${selectedProject.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="download-btn"
              >
                Download Project
              </a>
            </div>
          </div>

          <div className="review-form">
            <div className="form-group">
              <label>Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="reviewed">Reviewed</option>
                <option value="pending">Pending Changes</option>
              </select>
            </div>

            <div className="form-group">
              <label>Feedback:</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback here..."
                rows="6"
              />
            </div>

            <button
              className="submit-review-btn"
              onClick={handleReview}
              disabled={!feedback.trim()}
            >
              Submit Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 