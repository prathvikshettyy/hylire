import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  CheckSquare,
  Calculator,
  FileText,
  MessageSquare,
  User,
  UserPlus,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navigation = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isBuilder = user.role === 'builder' || user.role === 'admin';

  const links = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/sites', label: 'Construction Sites', icon: HardHat },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/calculators', label: 'Estimator tools', icon: Calculator },
    { path: '/documents', label: 'Document Vault', icon: FileText },
    { path: '/chat', label: 'Team Collaboration', icon: MessageSquare },
    ...(isBuilder ? [{ path: '/register', label: 'Create Account', icon: UserPlus }] : []),
    { path: '/profile', label: 'User Profile', icon: User },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-text">Hylire</span>
        </div>
        <ThemeToggle variant="icon" />
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px 4px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Theme Mode</span>
          <ThemeToggle variant="segmented" />
        </div>

        <div className="user-profile-summary">
          <div className="user-avatar">
            {getInitials(user.fullName || user.email)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button onClick={logout} className="btn-logout" title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navigation;
