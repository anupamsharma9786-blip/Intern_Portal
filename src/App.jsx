import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import InternDashboard from './pages/InternDashboard';
import HRDashboard from './pages/HRDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // થીમ બદલાય ત્યારે HTML ના data-theme એટ્રીબ્યુટમાં સેટ કરવું
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <>
      {/* ગ્લોબલ Theme Toggle બટન */}
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Intern Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['intern']} />}>
          <Route path="/intern/dashboard" element={<InternDashboard />} />
        </Route>

        {/* HR Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['hr']} />}>
          <Route path="/hr/dashboard" element={<HRDashboard />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Fallback Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}