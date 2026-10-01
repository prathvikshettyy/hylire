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
  const [apiBaseUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

  useEffect(() => {
    // Check sessionStorage for existing session
    const savedUser = sessionStorage.getItem('hylire_user');
    const savedToken = sessionStorage.getItem('hylire_token');
    
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
        sessionStorage.setItem('hylire_user', JSON.stringify(data.user));
        sessionStorage.setItem('hylire_token', data.token);
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
        sessionStorage.setItem('hylire_user', JSON.stringify(matchedMockUser));
        sessionStorage.setItem('hylire_token', mockToken);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials. Hint: use password123 with any email like engineer@hylire.com' };
      }
    }
  };

  const register = async (email, password, fullName, role) => {
    // Client-side guard: Only Builders/Admins can create accounts
    if (!user || (user.role !== 'builder' && user.role !== 'admin')) {
      return { success: false, error: 'Access denied: Only Builders can create user accounts.' };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email, password, fullName, role })
      });

      if (response.ok) {
        const data = await response.json();
        // Update offline localStore with created user for immediate availability across modules
        try {
          const rawStore = localStorage.getItem('hylire_db_store');
          if (rawStore) {
            const parsedStore = JSON.parse(rawStore);
            if (Array.isArray(parsedStore.users)) {
              const createdUser = data.user || { id: `u-${Date.now()}`, email, fullName, role };
              if (!parsedStore.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                parsedStore.users.push(createdUser);
                localStorage.setItem('hylire_db_store', JSON.stringify(parsedStore));
              }
            }
          }
        } catch (e) {
          console.warn('Could not sync created user to localStore:', e);
        }
        return { success: true, user: data.user };
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Registration failed');
      }
    } catch (error) {
      console.warn('API connection failed or restricted, attempting offline fallback:', error.message);
      
      // If error was explicitly returned from server as forbidden/error, forward that error
      if (error.message && (error.message.includes('Access denied') || error.message.includes('already exists'))) {
        return { success: false, error: error.message };
      }

      // Offline fallback: verify current user is builder/admin
      if (user && (user.role === 'builder' || user.role === 'admin')) {
        try {
          const rawStore = localStorage.getItem('hylire_db_store');
          const store = rawStore ? JSON.parse(rawStore) : { users: [...MOCK_USERS] };
          if (!Array.isArray(store.users)) store.users = [...MOCK_USERS];
          
          if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'User with this email already exists.' };
          }

          const newUser = {
            id: `u-${Date.now()}`,
            email,
            password,
            fullName,
            role,
            createdAt: new Date().toISOString()
          };
          store.users.push(newUser);
          localStorage.setItem('hylire_db_store', JSON.stringify(store));
          return { success: true, user: newUser, warning: 'Simulated successfully offline in local store.' };
        } catch (e) {
          return { success: false, error: 'Failed to create user in local store.' };
        }
      }

      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('hylire_user');
    sessionStorage.removeItem('hylire_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, apiBaseUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
