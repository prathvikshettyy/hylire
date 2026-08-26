import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navigation from './components/Navigation';
import { Sun, Moon } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Sites from './pages/Sites';
import Tasks from './pages/Tasks';
import Calculators from './pages/Calculators';
import Documents from './pages/Documents';
import TeamChat from './pages/TeamChat';
import UserProfile from './pages/UserProfile';

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
        Loading Hylire Systems...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// Main Layout Wrapper for Authenticated Users
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="app-container">
      {/* Dynamic Ambient Background orbs */}
      <div className="bg-glow-container">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
      </div>
      
      {/* Sidebar Navigation */}
      <Navigation />

      {/* Main Content Area */}
      <div className="app-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'var(--form-input-bg)', border: '1px solid var(--border-color)', padding: '4px 10px', borderRadius: 12 }}>
              Secure Network Status: Online
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'var(--btn-secondary-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'var(--transition-smooth)'
              }}
              title={`Switch to ${theme === 'dark' ? 'Cream' : 'Dark'} Theme`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === 'dark' ? 'Cream Mode' : 'Dark Mode'}</span>
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user?.fullName}</strong>
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secure Internal Portal Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/projects" element={
            <PrivateRoute>
              <AppLayout>
                <Projects />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/sites" element={
            <PrivateRoute>
              <AppLayout>
                <Sites />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/tasks" element={
            <PrivateRoute>
              <AppLayout>
                <Tasks />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/calculators" element={
            <PrivateRoute>
              <AppLayout>
                <Calculators />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/documents" element={
            <PrivateRoute>
              <AppLayout>
                <Documents />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/chat" element={
            <PrivateRoute>
              <AppLayout>
                <TeamChat />
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <AppLayout>
                <UserProfile />
              </AppLayout>
            </PrivateRoute>
          } />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
