import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
// import Links from './components/Links';
// import Analytics from './components/Analytics';
// import Settings from './components/Settings';
import ProtectedRoute from './components/ProtectedRoute';	
import './App.css';

function App() {
	return (
		<Router>
			<div className="app">
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />
					<Route element={<ProtectedRoute />}>
						<Route path="/" element={<Dashboard />} />
						{/* <Route path="/links" element={<Links />} /> */}
						{/* <Route path="/analytics" element={<Analytics />} /> */}
						{/* <Route path="/settings" element={<Settings />} /> */}
					</Route>
				</Routes>
			</div>
		</Router>
	);
}

export default App;
