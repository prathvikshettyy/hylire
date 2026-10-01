import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Support localStorage keys 'hylire-theme' or 'hylire_theme', default to dark
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('hylire-theme') || localStorage.getItem('hylire_theme');
    if (saved === 'light' || saved === 'dark' || saved === 'cream') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    document.body.className = theme;
    localStorage.setItem('hylire-theme', theme);
    localStorage.setItem('hylire_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'cream' : (prev === 'cream' ? 'light' : 'dark')));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'cream') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context || { theme: 'dark', isDark: true, toggleTheme: () => { }, setTheme: () => { } };
};
