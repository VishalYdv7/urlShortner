import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './EditLinkCSS.css';

const EditLink = ({ link, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    url: link.originalLink,
    remarks: link.remarks,
    isExpirable: link.expirationDate ? true : false,
    expirationDate: link.expirationDate ? new Date(link.expirationDate) : null
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleToggle = () => {
    setFormData({ ...formData, isExpirable: !formData.isExpirable });
    if (!formData.isExpirable) {
      setFormData({ ...formData, expirationDate: null });
    }
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, expirationDate: date });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let formErrors = {};

    if (!formData.url) {
      formErrors.url = 'This field is mandatory';
    }
    if (!formData.remarks) {
      formErrors.remarks = 'This field is mandatory';
    }
    if (formData.isExpirable && !formData.expirationDate) {
      formErrors.expirationDate = 'This field is mandatory';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Save updated link to backend
    fetch(`http://localhost:5000/links/${link.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(updatedLink => {
        onSave(updatedLink);
      })
      .catch(error => console.error('Error updating link:', error));
  };

  return (
    <div className='popup'>
      <div className='popup-inner'>
        <form onSubmit={handleFormSubmit}>
          <h2>Edit Link</h2>
          <p>URL</p>
          <input
            type="url"
            name="url"
            placeholder="https://web.whatsapp.com/"
            value={formData.url}
            onChange={handleChange}
            required
          />
          {errors.url && <span className='error'>{errors.url}</span>}
          <p>Remarks</p>
          <input
            type="text"
            name="remarks"
            placeholder="Add remarks"
            value={formData.remarks}
            onChange={handleChange}
            required
          />
          {errors.remarks && <span className='error'>{errors.remarks}</span>}
          <div className='isExpirable'>
            <p>Link Expiration</p>
            <label className="switch">
              <input type="checkbox" checked={formData.isExpirable} onChange={handleToggle} />
              <span className="slider round"></span>
            </label>
          </div>
          {formData.isExpirable && (
            <div className='expirationDate'>
              <DatePicker
                selected={formData.expirationDate}
                onChange={handleDateChange}
                showTimeSelect
                dateFormat="MMM d, yyyy, h:mm aa"
                placeholderText="Select expiration date and time"
              />
              {errors.expirationDate && <span className='error'>{errors.expirationDate}</span>}
            </div>
          )}
          <div className='bot'>
            <button type="button" onClick={onClose} className='clear'>Cancel</button>
            <button type="submit" className='CreateNew'>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLink;