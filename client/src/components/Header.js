import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './HeaderCSS.css';

export const Header = () => {
	const [user, setUser] = useState({ name: '' });
	const [greeting, setGreeting] = useState('');
	const [moon, setMoon] = useState('');
	const [showDropdown, setShowDropdown] = useState(false);
	const date = new Date().toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});

	const navigate = useNavigate();

	// Fetch user profile data from the backend
	useEffect(() => {
		const fetchUserProfile = async () => {
			try {
				const token = localStorage.getItem('token');
				if (!token) {
				console.error('No token found');
				navigate('/login'); // Redirect to login if no token is found
				return;
				}

				const response = await axios.get('http://localhost:5000/user', {
				headers: { Authorization: token },
				});
				setUser(response.data); // Set user data in state
			} catch (error) {
				console.error('Error fetching user profile:', error);
				if (error.response && error.response.status === 401) {
				// If token is invalid, redirect to login
				localStorage.removeItem('token');
				navigate('/login');
				}
			}
		};
		fetchUserProfile();
	}, [navigate]);

	// Determine the greeting based on the time of day
	useEffect(() => {
		const date = new Date();
		const hours = date.getHours();

		if (hours >= 3 && hours < 12) {
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

	// Handle logout
	const handleLogout = () => {
		localStorage.removeItem('token'); // Remove the token from localStorage
		navigate('/login'); // Redirect to the login page
	};

	return (
		<header className="header">
		<div className="full-greeting">
			<div className="sun-moon">{moon}</div>
			<div className="greeting">
			<div>
				{greeting}, <span className="name">{user.name}</span>
			</div>
			<div className="date">{date}</div>
			</div>
		</div>
		<div>
			<button className="createLink">+ Create New</button>
		</div>
		<div className="search-bar">
			<input type="text" placeholder=" Search by remarks" />
		</div>
		<div className="profile-pic-container">
			<div
			className="profile-pic"
			onClick={() => setShowDropdown(!showDropdown)} // Toggle dropdown on click
			>
			{getInitials(user.name)}
			</div>
			{showDropdown && (
			<div className="dropdown-menu">
				<div className="dropdown-item" onClick={handleLogout}>
				Logout
				</div>
			</div>
			)}
		</div>
		</header>
	);
};

export default Header;