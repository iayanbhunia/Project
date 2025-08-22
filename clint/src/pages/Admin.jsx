import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createElection } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

function Admin() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    constituencies: '',
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is an admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Redirect if not an admin
      if (parsedUser.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/');
      }
    } else {
      // Redirect if not logged in
      toast.error('Please log in to access this page.');
      navigate('/login');
    }
  }, [navigate]);

  const { title, description, startDate, endDate, constituencies } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !startDate || !endDate || !constituencies) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      // Format constituencies as an array of objects with just the name
      // Leaders and voters will be added automatically on the server
      const constituenciesArray = constituencies.split(',').map(name => ({
        name: name.trim()
      }));

      const electionData = {
        title,
        description,
        startDate,
        endDate,
        constituencies: constituenciesArray,
        status: 'upcoming'
      };

      const response = await createElection(electionData);
      toast.success('Election created successfully');
      navigate(`/elections/${response._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create election');
      setLoading(false);
    }
  };

  // If still checking user status or not an admin, show loading
  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      
      <Card title="Create New Election" className="election-form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Election Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={handleChange}
              placeholder="Enter election title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={handleChange}
              placeholder="Enter election description"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="constituencies">Constituencies</label>
            <input
              type="text"
              id="constituencies"
              name="constituencies"
              value={constituencies}
              onChange={handleChange}
              placeholder="Enter constituencies separated by commas (e.g., Delhi, Mumbai, Chennai)"
              required
            />
            <small className="form-text">
              Enter constituency names separated by commas
            </small>
          </div>

          <Button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Election'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default Admin; 