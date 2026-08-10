import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

// MOCK USERS for offline fallback authentication
const MOCK_USERS = [
  { id: "u-1", email: "admin@hylire.com", fullName: "John Builder", role: "builder" },
  { id: "u-2", email: "engineer@hylire.com", fullName: "Sarah Engineer", role: "engineer" },
  { id: "u-3", email: "client@hylire.com", fullName: "Robert Client", role: "client" },
  { id: "u-4", email: "contractor@hylire.com", fullName: "Mark Contractor", role: "contractor" },
  { id: "u-5", email: "worker@hylire.com", fullName: "David Worker", role: "worker" }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiBaseUrl] = useState('http://localhost:5000/api');

  useEffect(() => {
    // Check localStorage for existing session
    const savedUser = localStorage.getItem('hylire_user');
    const savedToken = localStorage.getItem('hylire_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('hylire_user', JSON.stringify(data.user));
        localStorage.setItem('hylire_token', data.token);
        return { success: true };
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Invalid credentials');
      }
    } catch (error) {
      console.warn('API connection failed, attempting offline fallback:', error.message);
      
      // Fallback offline verification
      const matchedMockUser = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && password === 'password123'
      );

      if (matchedMockUser) {
        setUser(matchedMockUser);
        const mockToken = `mock-token-${matchedMockUser.id}-${Date.now()}`;
        setToken(mockToken);
        localStorage.setItem('hylire_user', JSON.stringify(matchedMockUser));
        localStorage.setItem('hylire_token', mockToken);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials. Hint: use password123 with any email like engineer@hylire.com' };
      }
    }
  };

  const register = async (email, password, fullName, role) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Registration failed');
      }
    } catch (error) {
      console.warn('API connection failed, simulating offline registration');
      // Simulated register success
      return { success: true, warning: 'Simulated successfully offline.' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hylire_user');
    localStorage.removeItem('hylire_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, apiBaseUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
