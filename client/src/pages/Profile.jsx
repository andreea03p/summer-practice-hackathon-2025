import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

export default function Profile() {
  const [projects, setProjects] = useState([]);
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
      const response = await axios.get('/api/projects/my-projects');
      setProjects(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching projects');
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
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Projects</h1>
        <button 
          className="submit-project-btn"
          onClick={() => navigate('/submit-project')}
        >
          Submit New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project._id} className="project-card">
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
            {project.adminFeedback && (
              <div className="admin-feedback">
                <h4>Admin Feedback:</h4>
                <p>{project.adminFeedback}</p>
              </div>
            )}
            <div className="project-actions">
              <a
                href={`/uploads/${project.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="download-btn"
              >
                Download Project
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}