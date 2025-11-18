import React, { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [instructor, setInstructor] = useState(null);

  const handleLogin = (instructorData) => {
    setInstructor(instructorData);
  };

  const handleLogout = () => {
    setInstructor(null);
  };

  if (!instructor) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard instructor={instructor} onLogout={handleLogout} />;
}

export default App;