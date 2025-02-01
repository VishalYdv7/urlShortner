import React, { useState } from 'react';

export const Popup = () => {
	const [formData, setFormData] = useState({
		url: '',
		remarks: '',
		isExpirable:'',
		expirationDate:'',
	});

	const [error, setError] = useState('');
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		// Clear error when user starts typing
		setError('');
	};

	const handleClear = async (e) => {
		setFormData({
			url: '',
			remarks: '',
			isExpirable:'',
			expirationDate:'',
		});
	}


	const handleCreateNew = async (e) => {

	}

	return (
		<div className='popup'>
			<div className='top'>
				<h3>New Link</h3>
				<h3>X</h3>
			</div>
			<div className='details'>
				<form onSubmit={handleCreateNew}>
					<p>Destination URL <span color='#FF0101'>*</span></p>
					<input
					type="url"
					name="url"
					placeholder="https://web.whatsapp.com/"
					value={formData.url}
					onChange={handleChange}
					required
					/>
					<p>Remarks</p>
					<input
					type="remarks"
					name="remarks"
					placeholder="Add remarks"
					value={formData.remarks}
					onChange={handleChange}
					required
					/>
					<div className='isExpirable'>
						<p>Link Expiration</p>
						
					</div>
					<div className='expirationDate'>
						
					</div>
					<div className='bot'>
						<button onClick={handleClear} className='clear'>Clear</button>
						<button type="submit" className='CreateNew' >Create New</button>
					</div>
				</form>
			</div>
			
		</div>
	)
}

export default Popup;