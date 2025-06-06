// src/components/SubmitProject.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import './SubmitProject.css';

export default function SubmitProject() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectFile: null
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const updateProjectId = new URLSearchParams(location.search).get('update');

  useEffect(() => {
    if (updateProjectId) {
      fetchProjectDetails(updateProjectId);
    }
  }, [updateProjectId]);

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await axios.get(`/api/projects/details/${projectId}`);
      const project = response.data.project;
      setFormData({
        title: project.title,
        description: project.description,
        projectFile: null
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Error loading project details');
      navigate('/my-projects');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.projectFile && !updateProjectId) {
      newErrors.projectFile = 'Project file is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'text/plain') {
      toast.error('Please upload a TXT file');
      e.target.value = null;
      setFilePreview(null);
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      e.target.value = null;
      setFilePreview(null);
      return;
    }

    setFormData({ ...formData, projectFile: file });

    // Preview file content
    try {
      const text = await file.text();
      setFilePreview(text.slice(0, 1000) + (text.length > 1000 ? '...' : ''));
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title.trim());
    formDataToSend.append('description', formData.description.trim());
    if (formData.projectFile) {
      formDataToSend.append('projectFile', formData.projectFile);
    }

    try {
      const endpoint = updateProjectId 
        ? `/api/projects/update/${updateProjectId}`
        : '/api/projects/submit';
      
      const response = await axios.post(endpoint, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(updateProjectId ? 'Project updated successfully' : 'Project submitted successfully');
      navigate('/my-projects');
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in again to submit a project');
        navigate('/login');
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error submitting project. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-project-container">
      <div className="submit-project-form">
        <h1>{updateProjectId ? 'Update Project' : 'Submit New Project'}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter project title"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter project description"
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Project File (TXT):</label>
            <div className="file-upload-container">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className={errors.projectFile ? 'error' : ''}
              />
              <p className="file-hint">
                {updateProjectId 
                  ? 'Upload a new file to update the project (optional)'
                  : 'Please upload a TXT file (max 10MB)'}
              </p>
              {errors.projectFile && <span className="error-message">{errors.projectFile}</span>}
            </div>
          </div>

          {filePreview && (
            <div className="file-preview">
              <h3>File Preview:</h3>
              <pre>{filePreview}</pre>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (updateProjectId ? 'Updating...' : 'Submitting...') 
                : (updateProjectId ? 'Update Project' : 'Submit Project')}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/my-projects')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
