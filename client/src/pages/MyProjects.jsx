import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/projects/my-projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error fetching projects');
    }
  };

  const handleProjectClick = async (projectId) => {
    try {
      const response = await axios.get(`/projects/details/${projectId}`);
      setSelectedProject(response.data.project);
      setReviewHistory(response.data.feedback || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Error fetching project details');
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
    <div className="my-projects">
      <div className="projects-section">
        <h2>My Submitted Projects</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project._id} 
              className={`project-card ${selectedProject?._id === project._id ? 'selected' : ''}`}
              onClick={() => handleProjectClick(project._id)}
            >
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              <div className="project-meta">
                <span className={`status-badge ${getStatusBadgeClass(project.status)}`}>
                  {project.status}
                </span>
                <span className="project-date">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              {project.version > 1 && (
                <p className="project-version">Version: {project.version}</p>
              )}
              <div className="project-actions">
                <a
                  href={`/projects/download/${project._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="download-btn"
                >
                  Download Project
                </a>
                {project.status === 'pending' && (
                  <button
                    className="update-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/submit-project?update=${project._id}`);
                    }}
                  >
                    Update Project
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="project-details-modal">
          <div className="modal-content">
            <h2>{selectedProject.title}</h2>
            <p className="project-description">{selectedProject.description}</p>
            
            <div className="project-status">
              <span className={`status-badge ${getStatusBadgeClass(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
              <span className="project-date">
                Submitted: {new Date(selectedProject.createdAt).toLocaleDateString()}
              </span>
            </div>

            {reviewHistory.length > 0 && (
              <div className="review-history">
                <h3>Review History</h3>
                <div className="review-list">
                  {reviewHistory.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <span className="reviewer">
                          {review.isAdminFeedback ? 'Admin' : review.user?.name}
                        </span>
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="review-content">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="close-modal-btn"
              onClick={() => {
                setSelectedProject(null);
                setReviewHistory([]);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 