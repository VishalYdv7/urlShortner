import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './HeaderCSS.css';

export const Header = () => {
	const [user, setUser] = useState({ name: '' });
	const [greeting, setGreeting] = useState('');
	const [moon, setMoon] = useState('');
	const date = new Date().toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});
	// Fetch user profile data from the backend
	useEffect(() => {
		const fetchUserProfile = async () => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
			console.error('No token found');
			return;
			}
			const response = await axios.get('http://localhost:5000/user', {
			headers: { Authorization: token },
			});
			setUser(response.data);
		} catch (error) {
			console.error('Error fetching user profile:', error);
		}
		};

		fetchUserProfile();
	}, []);

	// Determine the greeting based on the time of day
	useEffect(() => {
		const date = new Date();
		console.log(date);
		const hours = date.getHours();

		if (3<hours < 12) {
		setGreeting('Good Morning');
		setMoon('☀️');
		} else if (hours < 18) {
		setGreeting('Good Afternoon');
		setMoon('☀️');
		} else if (hours < 22) {
		setGreeting('Good Evening');
		setMoon('🌙');
		} else {
		setGreeting('Good Night');
		setMoon('🌙');
		}
	}, []);

	// Get initials from the user's name
	const getInitials = (name) => {
		if (!name) return '';
		const names = name.split(' ');
		return names.map((n) => n[0]).join('').toUpperCase();
	};

	return (
		<header className="header">
			<div className='full-greeting'>
				<div className='sun-moon'>
					{moon}
				</div>
				<div className="greeting">
					<div>{greeting}, <span className="name">{user.name}</span></div>
					<div className="date">{date}</div>
				</div>
			</div>
			<div>
				<button className='createLink'>+ Create New</button>
			</div>
			<div className="search-bar">
				<input type="text" placeholder=" Search by remarks" />
			</div>
			<div className="profile-pic">{getInitials(user.name)}</div>
		</header>
	);
};

export default Header;