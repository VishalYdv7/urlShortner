import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../images/logo.png';
import dashboardIcon from '../images/DashboardIcon.png';
import linkIcon from '../images/LinkIcon.png';
import analyticsIcon from '../images/AnalyticsIcon.png';
import settingsIcon from '../images/SettingsIcon.png';
import './SideBarCSS.css';

export const SideBar = () => {
	const navigate = useNavigate();
	const location = useLocation(); // Get the current route

	// Function to check if a link is active
	const isActive = (path) => {
		return location.pathname === path;
	};

	return (
		<div className='SideBar'>
			<div className="logo">
				<img src={logo} alt="logo" />
			</div>
			<div className='links'>
				<div
				className={`dashboardIcon ${isActive('/') ? 'active' : ''}`}
				onClick={() => navigate('/')}
				>
					<img src={dashboardIcon} alt="dashboardIcon" />
					<p>Dashboard</p>
				</div>
				<div
				className={`linkIcon ${isActive('/links') ? 'active' : ''}`}
				onClick={() => navigate('/links')}
				>
					<img src={linkIcon} alt="linkIcon" />
					<p>Links</p>
				</div>
				<div
				className={`analyticsIcon ${isActive('/analytics') ? 'active' : ''}`}
				onClick={() => navigate('/analytics')}
				>
					<img src={analyticsIcon} alt="analyticsIcon" />
					<p>Analytics</p>
				</div>
				<div
				className={`settingsIcon ${isActive('/settings') ? 'active' : ''}`}
				onClick={() => navigate('/settings')}
				>
					<img src={settingsIcon} alt="settingsIcon" />
					<p>Settings</p>
				</div>
			</div>
		</div>
	);
};

export default SideBar;