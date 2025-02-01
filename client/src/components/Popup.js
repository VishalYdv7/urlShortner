import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './PopupCSS.css';

const Popup = ({ handleSubmit, handleClear, formData, setFormData }) => {
	const [isExpirable, setIsExpirable] = useState(false);
	const [expirationDate, setExpirationDate] = useState(null);
	const [errors, setErrors] = useState({});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setErrors({ ...errors, [e.target.name]: '' });
	};

	const handleToggle = () => {
		setIsExpirable(!isExpirable);
		if (!isExpirable) {
		setExpirationDate(null);
		}
	};

	const handleDateChange = (date) => {
		setExpirationDate(date);
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
		if (isExpirable && !expirationDate) {
		formErrors.expirationDate = 'This field is mandatory';
		}

		if (Object.keys(formErrors).length > 0) {
		setErrors(formErrors);
		return;
		}

		handleSubmit({ ...formData, expirationDate: isExpirable ? expirationDate : null });
	};

	return (
		<div className='popup'>
		<div className='popup-inner'>
			<form onSubmit={handleFormSubmit}>
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
				<input type="checkbox" checked={isExpirable} onChange={handleToggle} />
				<span className="slider round"></span>
				</label>
			</div>
			{isExpirable && (
				<div className='expirationDate'>
				<DatePicker
					selected={expirationDate}
					onChange={handleDateChange}
					showTimeSelect
					dateFormat="MMM d, yyyy, h:mm aa"
					placeholderText="Select expiration date and time"
				/>
				{errors.expirationDate && <span className='error'>{errors.expirationDate}</span>}
				</div>
			)}
			<div className='bot'>
				<button type="button" onClick={handleClear} className='clear'>Clear</button>
				<button type="submit" className='CreateNew'>Create New</button>
			</div>
			</form>
		</div>
		</div>
	);
};
export default Popup;