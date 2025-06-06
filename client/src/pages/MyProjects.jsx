import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MyProjects.css';

export default function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectFile: null
  });
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/zip') {
      setFormData({ ...formData, projectFile: file });
    } else {
      toast.error('Please upload a ZIP file');
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectFile) {
      toast.error('Please select a project file');
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('projectFile', formData.projectFile);

    try {
      await axios.post('/api/projects/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Project submitted successfully');
      setFormData({
        title: '',
        description: '',
        projectFile: null
      });
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error submitting project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProject || !formData.projectFile) {
      toast.error('Please select a project file');
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title || selectedProject.title);
    formDataToSend.append('description', formData.description || selectedProject.description);
    formDataToSend.append('projectFile', formData.projectFile);

    try {
      await axios.post(`/api/projects/update/${selectedProject._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Project updated successfully');
      setFormData({
        title: '',
        description: '',
        projectFile: null
      });
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Error updating project');
    } finally {
      setIsSubmitting(false);
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
        <h2>My Projects</h2>
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project._id}
              className={`project-card ${selectedProject?._id === project._id ? 'selected' : ''}`}
              onClick={() => setSelectedProject(project)}
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
              {project.adminFeedback && (
                <div className="admin-feedback">
                  <h4>Admin Feedback:</h4>
                  <p>{project.adminFeedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="project-form-section">
        <h2>{selectedProject ? 'Update Project' : 'Submit New Project'}</h2>
        <form onSubmit={selectedProject ? handleUpdate : handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={selectedProject ? selectedProject.title : 'Enter project title'}
              required={!selectedProject}
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={selectedProject ? selectedProject.description : 'Enter project description'}
              required={!selectedProject}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Project File (ZIP):</label>
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              required={!selectedProject}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : (selectedProject ? 'Update Project' : 'Submit Project')}
          </button>

          {selectedProject && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setSelectedProject(null);
                setFormData({
                  title: '',
                  description: '',
                  projectFile: null
                });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>
    </div>
  );
} 