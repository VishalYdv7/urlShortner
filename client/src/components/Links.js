import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import EditLink from './EditLink';
import './LinksCSS.css';

const Links = () => {
  const [links, setLinks] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'ascending' });
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [currentLink, setCurrentLink] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);

  useEffect(() => {
    fetch('https://urlshortner-tm61.onrender.com/links', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLinks(data);
        } else {
          console.error('Fetched data is not an array:', data);
        }
      })
      .catch(error => console.error('Error fetching links:', error));
  }, []);

  const sortLinks = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedLinks = [...links].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const handleEditClick = (link) => {
    setCurrentLink(link);
    setShowEditPopup(true);
  };

  const handleDeleteClick = (link) => {
    setLinkToDelete(link);
    setShowDeletePopup(true);
  };

  const handleDeleteConfirm = () => {
    // Delete link from backend
    fetch(`https://urlshortner-tm61.onrender.com/links/${linkToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(() => {
        setLinks(links.filter(link => link.id !== linkToDelete.id));
        setShowDeletePopup(false);
      })
      .catch(error => console.error('Error deleting link:', error));
  };

  return (
    <div className='links-container'>
      <Sidebar />
      <div className='links-content'>
        <Header />
        <table className='links-table'>
          <thead>
            <tr>
              <th onClick={() => sortLinks('date')}>Date</th>
              <th>Original Link</th>
              <th>Short Link</th>
              <th>Remarks</th>
              <th>Clicks</th>
              <th onClick={() => sortLinks('status')}>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedLinks.map(link => (
              <tr key={link.id}>
                <td>{new Date(link.date).toLocaleDateString()}</td>
                <td>{link.originalUrl}</td>
                <td>
                  {link.shortUrl}
                  <button className='copy-icon' onClick={() => navigator.clipboard.writeText(link.shortUrl)}>
                    📄
                  </button>
                </td>
                <td>{link.remarks}</td>
                <td>{link.clicks}</td>
                <td>{link.status}</td>
                <td>
                  <button className='edit-icon' onClick={() => handleEditClick(link)}>✏️</button>
                  <button className='delete-icon' onClick={() => handleDeleteClick(link)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showEditPopup && (
        <EditLink
          link={currentLink}
          onClose={() => setShowEditPopup(false)}
          onSave={(updatedLink) => {
            setLinks(links.map(link => (link.id === updatedLink.id ? updatedLink : link)));
            setShowEditPopup(false);
          }}
        />
      )}
      {showDeletePopup && (
        <div className='popup'>
          <div className='popup-inner'>
            <p>Are you sure you want to remove it?</p>
            <button onClick={handleDeleteConfirm}>Yes</button>
            <button onClick={() => setShowDeletePopup(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Links;