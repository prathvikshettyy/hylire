import React from 'react';
import { User, Shield, CheckCircle, Lock, Moon, Sun, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const UserProfile = () => {
  const { user } = useAuth();
  const { theme, setTheme, isDark } = useTheme();

  if (!user) return null;

  // Describe role specific clearance permissions in Hylire
  const getRoleCapabilities = (role) => {
    switch (role) {
      case 'builder':
      case 'admin':
        return [
          'Full control over Projects, Budgets, and Construction Sites.',
          'Upload, download, and manage system legal contracts/drawings.',
          'Approve brick estimators and cost projections.',
          'Define project roles and assign engineers/contractors.'
        ];
      case 'engineer':
        return [
          'Manage tasks and worker allocations at assigned construction sites.',
          'Perform smart brick calculations and upload material requirement sheets.',
          'Share daily progress reports and photos in document vault.',
          'Collaborate with Builder and Client in real-time chat.'
        ];
      case 'contractor':
        return [
          'Assign construction tasks and workers to checklist panels.',
          'Monitor material inventory levels and order cement/sand/steel aggregates.',
          'Update task board stages from To Do to Complete.',
          'Share contractor agreements and bills in Document vault.'
        ];
      case 'worker':
        return [
          'View assigned daily construction task checklist.',
          'Mark tasks as In-Progress or In-Review upon physical completion.',
          'View active supervisor details and coordinates.'
        ];
      case 'client':
        return [
          'View real-time construction project timeline and completed tasks.',
          'Examine cost estimations, materials summary, and budget status reports.',
          'Download blueprints and finalized contracts.',
          'Message project supervisors directly.'
        ];
      default:
        return ['Standard platform reader access.'];
    }
  };

  return (
    <div className="main-view" style={{ maxWidth: 840, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 className="header-title" style={{ fontSize: '2rem' }}>User Profile</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure account preferences, theme modes, and verify security clearances</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* User Card info */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 32 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 800,
            boxShadow: '0 4px 16px var(--primary-glow)'
          }}>
            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {user.fullName}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>{user.email}</p>
            <span className="badge badge-info" style={{ display: 'inline-flex', gap: 6, padding: '6px 12px' }}>
              <Shield size={12} />
              <span>Role: {user.role}</span>
            </span>
          </div>
        </div>

        {/* Theme & Appearance Settings */}
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
            <Palette size={18} /> Appearance & Theme Mode
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Choose your preferred interface theme. Your choice is automatically saved and synchronized across all sessions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Dark Mode Card */}
            <div 
              onClick={() => setTheme('dark')}
              style={{
                padding: '20px',
                borderRadius: '14px',
                border: isDark ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                background: isDark ? 'var(--primary-glow)' : 'var(--bg-subtle)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0b0e17', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Moon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dark Theme</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Deep Charcoal & Indigo</span>
                  </div>
                </div>
                {isDark && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Sleek dark interface designed for low-light environments and long engineering work sessions.
              </p>
            </div>

            {/* Light Mode Card */}
            <div 
              onClick={() => setTheme('light')}
              style={{
                padding: '20px',
                borderRadius: '14px',
                border: !isDark ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                background: !isDark ? 'var(--primary-glow)' : 'var(--bg-subtle)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ffffff', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <Sun size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Light Theme</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Crisp Clean & Vibrant</span>
                  </div>
                </div>
                {!isDark && (
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Active</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                High-contrast, crystal-clear daytime layout tailored for bright site inspections and readability.
              </p>
            </div>
          </div>
        </div>

        {/* Permissions details */}
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--primary-color)' }}>
            <Lock size={18} /> System Clearances & Permissions
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Your account is assigned the <strong>{user.role}</strong> credential set. Below are your cleared activities within the Hylire portal:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {getRoleCapabilities(user.role).map((cap, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <CheckCircle size={16} style={{ color: 'var(--color-success)', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
