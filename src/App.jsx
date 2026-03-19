// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard'; // Import your new page
import DoctorDashboard from './pages/DoctorDashboard'; // Import Doctor Dashboard
import PharmaDashboard from './pages/PharmaDashboard';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* New Dashboard Route */}
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/pharmacist-dashboard" element={<PharmaDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;