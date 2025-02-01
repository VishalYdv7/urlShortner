// components/Dashboard.js
import React, { useEffect, useState } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import './DashboardCSS.css';

const Dashboard = () => {
	const [dashboardData, setDashboardData] = useState({
		totalClicks: 0,
		dateWiseClicks: {},
		deviceWiseClicks: {}
	});

	useEffect(() => {
		fetch('/dashboard')
		.then(res => res.json())
		.then(data => {
			const deviceData = Object.entries(data.deviceWiseClicks).map(([device, clicks]) => ({
			name: device,
			value: clicks
			}));
			
			const dateData = Object.entries(data.dateWiseClicks)
			.map(([date, clicks]) => ({
				date: date.split('-').slice(1).join('-'),
				value: clicks
			}))
			.sort((a, b) => new Date(b.date) - new Date(a.date));

			setDashboardData({
			totalClicks: data.totalClicks,
			dateWiseClicks: dateData,
			deviceWiseClicks: deviceData
			});
		})
		.catch(error => console.error('Error fetching dashboard data:', error));
	}, []);

	return (
		<div className='dashboard-container'>
			<div>
				<Sidebar/>
			</div>
			<div className="dashboard">
				<div className="welcome-text">
					<Header/>
				</div>
				
				<div className="total-clicks">
					Total Clicks <span className="click-value">{dashboardData.totalClicks}</span>
				</div>

				<div className="charts-container">
					<div className="chart-box">
					<div className="chart-title">Date-wise Clicks</div>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart
						data={dashboardData.dateWiseClicks}
						layout="vertical"
						>
						<CartesianGrid strokeDasharray="3 3" horizontal={false} />
						<XAxis type="number" />
						<YAxis dataKey="date" type="category" width={60} />
						<Bar dataKey="value" fill="#0066FF" barSize={20} />
						</BarChart>
					</ResponsiveContainer>
					</div>

					<div className="chart-box">
					<div className="chart-title">Click Devices</div>
					<ResponsiveContainer width="100%" height={200}>
						<BarChart
						data={dashboardData.deviceWiseClicks}
						layout="vertical"
						>
						<CartesianGrid strokeDasharray="3 3" horizontal={false} />
						<XAxis type="number" />
						<YAxis dataKey="name" type="category" width={60} />
						<Bar dataKey="value" fill="#0066FF" barSize={20} />
						</BarChart>
					</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;