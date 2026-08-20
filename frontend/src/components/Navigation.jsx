import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  HardHat, 
  CheckSquare, 
  Calculator, 
  FileText, 
  MessageSquare, 
  User, 
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const links = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/sites', label: 'Construction Sites', icon: HardHat },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/calculators', label: 'Estimator Tools', icon: Calculator },
    { path: '/documents', label: 'Document Vault', icon: FileText },
    { path: '/chat', label: 'Team Chat', icon: MessageSquare },
    { path: '/profile', label: 'User Profile', icon: User },
  ];

  // Primary bottom navigation items for mobile
  const mobilePrimaryLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/calculators', label: 'Estimator', icon: Calculator },
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

  const closeDrawer = () => setMobileDrawerOpen(false);

  return (
    <>
      {/* 1. Mobile App Top Bar (< 992px) */}
      <header className="mobile-app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={() => setMobileDrawerOpen(true)} 
            className="mobile-menu-btn"
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
          <div className="mobile-app-logo">
            <div className="logo-icon" style={{ width: 28, height: 28 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-text" style={{ fontSize: '1.15rem' }}>Hylire</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {getInitials(user.fullName || user.email)}
          </div>
        </div>
      </header>

      {/* 2. Mobile Drawer Backdrop Overlay */}
      {mobileDrawerOpen && (
        <div 
          className="mobile-drawer-backdrop"
          onClick={closeDrawer}
        />
      )}

      {/* 3. Main Sidebar Navigation (Desktop Fixed + Mobile Slide-In Drawer) */}
      <aside className={`sidebar ${mobileDrawerOpen ? 'mobile-drawer-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="logo-text">Hylire</span>
          </div>

          {/* Close button for mobile drawer */}
          <button 
            onClick={closeDrawer} 
            className="mobile-drawer-close-btn"
            aria-label="Close Navigation Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User preview banner on mobile */}
        <div className="mobile-drawer-user-card">
          <div className="user-avatar">
            {getInitials(user.fullName || user.email)}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user.fullName || 'Team Member'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', textTransform: 'capitalize' }}>{user.role || 'Member'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink 
                key={link.path} 
                to={link.path} 
                onClick={closeDrawer}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
                <ChevronRight size={14} className="mobile-chevron" />
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
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

      {/* 4. Native-Style Mobile Bottom App Bar (< 992px) */}
      <nav className="mobile-bottom-bar">
        {mobilePrimaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <NavLink 
              key={link.path} 
              to={link.path} 
              className={`mobile-bottom-tab ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button 
          onClick={() => setMobileDrawerOpen(true)}
          className={`mobile-bottom-tab ${mobileDrawerOpen ? 'active' : ''}`}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};

export default Navigation;
