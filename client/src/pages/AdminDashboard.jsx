import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('reviewed');
  const [rating, setRating] = useState(3);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'newest'
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    updated: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchProjects();
  }, [user]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, filters]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects/all');
      setProjects(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching projects');
    }
  };

  const calculateStats = (projectList) => {
    const stats = {
      total: projectList.length,
      pending: projectList.filter(p => p.status === 'pending').length,
      reviewed: projectList.filter(p => p.status === 'reviewed').length,
      updated: projectList.filter(p => p.status === 'updated').length
    };
    setStats(stats);
  };

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.owner?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const handleProjectClick = async (projectId) => {
    try {
      const response = await axios.get(`/api/projects/details/${projectId}`);
      setSelectedProject(response.data.project);
      setReviewHistory(response.data.feedback || []);
      setFeedback('');
      setRating(3);
      setStatus(response.data.project.status);
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
        status,
        rating
      });
      
      toast.success('Review submitted successfully');
      setFeedback('');
      setRating(3);
      setSelectedProject(null);
      fetchProjects(); // Refresh the projects list
    } catch (error) {
      console.error(error);
      toast.error('Error submitting review');
    }
  };

  const handleBulkAction = async (action, selectedIds) => {
    if (!selectedIds.length) {
      toast.error('Please select at least one project');
      return;
    }

    try {
      await axios.post('/api/projects/bulk-action', {
        action,
        projectIds: selectedIds
      });
      
      toast.success('Bulk action completed successfully');
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error('Error performing bulk action');
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
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Projects</h3>
            <p>{stats.total}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Review</h3>
            <p>{stats.pending}</p>
          </div>
          <div className="stat-card">
            <h3>Reviewed</h3>
            <p>{stats.reviewed}</p>
          </div>
          <div className="stat-card">
            <h3>Updated</h3>
            <p>{stats.updated}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="projects-section">
          <div className="projects-header">
            <h2>Projects to Review</h2>
            <div className="filters">
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="search-input"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="updated">Updated</option>
              </select>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">By Title</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className={`project-card ${selectedProject?._id === project._id ? 'selected' : ''}`}
                onClick={() => handleProjectClick(project._id)}
              >
                <h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-meta">
                  <span className="owner">By: {project.owner?.name || 'Unknown'}</span>
                  <span className={`status-badge ${getStatusBadgeClass(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <div className="project-info">
                  <span className="project-date">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  {project.version > 1 && (
                    <span className="project-version">Version: {project.version}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedProject && (
          <div className="review-section">
            <div className="review-header">
              <h2>Review Project</h2>
              <button
                className="close-review-btn"
                onClick={() => setSelectedProject(null)}
              >
                Close
              </button>
            </div>

            <div className="project-details">
              <h3>{selectedProject.title}</h3>
              <p className="description">{selectedProject.description}</p>
              <div className="project-meta">
                <span className="owner">By: {selectedProject.owner?.name || 'Unknown'}</span>
                <span className="date">
                  Submitted: {new Date(selectedProject.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="project-actions">
                <a
                  href={`/api/projects/download/${selectedProject._id}`}
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
                  className="status-select"
                >
                  <option value="reviewed">Reviewed</option>
                  <option value="pending">Pending Changes</option>
                  <option value="updated">Updated</option>
                </select>
              </div>

              <div className="form-group">
                <label>Rating:</label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Feedback:</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your feedback here..."
                  rows="6"
                  className="feedback-textarea"
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
                      {review.rating && (
                        <div className="review-rating">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`star ${i < review.rating ? 'active' : ''}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="review-content">{review.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 