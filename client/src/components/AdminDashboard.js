import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('pending');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Stats for the dashboard
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    approved: projects.filter(p => p.status === 'approved').length,
    rejected: projects.filter(p => p.status === 'rejected').length
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProjects();
  }, [user, navigate]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/projects/all');
      setProjects(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectId) => {
    try {
      const response = await axios.get(`/projects/details/${projectId}`);
      setSelectedProject(response.data.project);
      setFeedback(response.data.project.adminFeedback || '');
      setStatus(response.data.project.status);
      setRating(response.data.project.averageRating || 0);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to fetch project details. Please try again.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      setError(null);
      
      // Validate status
      if (!status || !['pending', 'approved', 'rejected', 'updated'].includes(status)) {
        setError('Invalid status selected');
        return;
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        setError('Rating must be between 1 and 5');
        return;
      }

      const response = await axios.post(`/projects/review/${selectedProject._id}`, {
        feedback,
        status,
        rating: rating || undefined
      });

      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      // Refresh the entire project list to ensure we have the latest data
      await fetchProjects();

      // Update the selected project with the response data
      setSelectedProject(response.data.project);
      
      // Show success message
      alert('Project reviewed successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-600">Total Projects</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-yellow-600">Pending</h3>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-green-600">Approved</h3>
          <p className="text-2xl font-bold">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-red-600">Rejected</h3>
          <p className="text-2xl font-bold">{stats.rejected}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Projects List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="space-y-4">
            {projects.map(project => (
              <div
                key={project._id}
                className={`p-4 rounded cursor-pointer transition-colors border ${
                  selectedProject?._id === project._id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
                onClick={() => handleProjectSelect(project._id)}
              >
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-sm text-gray-600">By: {project.owner.name}</p>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-medium ${
                    project.status === 'approved' ? 'text-green-600' :
                    project.status === 'rejected' ? 'text-red-600' :
                    project.status === 'updated' ? 'text-blue-600' :
                    'text-yellow-600'
                  }`}>{project.status}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Submitted: {new Date(project.createdAt).toLocaleDateString()}
                </p>
                {project.lastReviewedAt && (
                  <p className="text-sm text-gray-600">
                    Last reviewed: {new Date(project.lastReviewedAt).toLocaleDateString()}
                    {project.lastReviewedBy && ` by ${project.lastReviewedBy.name}`}
                  </p>
                )}
                {project.averageRating > 0 && (
                  <p className="text-sm text-gray-600">
                    Rating: {project.averageRating.toFixed(1)}/5 ({project.ratingCount} reviews)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Review Form */}
        {selectedProject && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Review Project</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Title</label>
                <p className="mt-1 text-gray-900">{selectedProject.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{selectedProject.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="updated">Updated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rating (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your feedback here..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Submit Review
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 