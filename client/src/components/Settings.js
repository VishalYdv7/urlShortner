import React, { useEffect, useState } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import './SettingsCSS.css';

const Settings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('https://urlshortner-tm61.onrender.com/settings')
      .then(res => res.json())
      .then(data => {
        setFormData({
          name: data.name,
          email: data.email,
          mobile: data.mobile
        });
      })
      .catch(error => console.error('Error fetching settings data:', error));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('https://urlshortner-tm61.onrender.com/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      setSuccess('Settings updated successfully!');
    } catch (err) {
      setError(err.message || 'An error occurred while updating settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete the account?')) {
      try {
        const response = await fetch('https://urlshortner-tm61.onrender.com/settings', {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete account');
        }

        // Redirect to home or login page after account deletion
        window.location.href = '/';
      } catch (err) {
        setError(err.message || 'An error occurred while deleting the account');
      }
    }
  };

  return (
    <div className='settings-container'>
      <div>
        <Sidebar />
      </div>
      <div className="settings">
        <div className="welcome-text">
          <Header />
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Mobile No.</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="delete-button" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;