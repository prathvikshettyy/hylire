import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ variant = 'icon', className = '' }) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div className={`theme-segmented-control ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`theme-segment-btn ${!isDark ? 'active' : ''}`}
          title="Switch to Light Theme"
        >
          <Sun size={15} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`theme-segment-btn ${isDark ? 'active' : ''}`}
          title="Switch to Dark Theme"
        >
          <Moon size={15} />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`btn-theme-full ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        aria-label="Toggle Theme"
      >
        <div className="theme-icon-box">
          {isDark ? <Sun size={16} className="sun-icon" /> : <Moon size={16} className="moon-icon" />}
        </div>
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    );
  }

  // Default compact icon toggle
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`btn-theme-toggle ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Theme"
    >
      <div className="theme-toggle-inner">
        {isDark ? (
          <Sun size={18} className="theme-icon sun-spin" />
        ) : (
          <Moon size={18} className="theme-icon moon-tilt" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
