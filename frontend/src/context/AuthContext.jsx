import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(api.currentUser);
  const [token, setToken] = useState(api.token);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('mdata_dark_mode') === 'true';
  });

  useEffect(() => {
    // Apply dark mode class to root HTML
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mdata_dark_mode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    async function verifySession() {
      if (api.token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            api.setSession(api.token, api.refreshToken, res.user);
          } else {
            api.clearSession();
            setUser(null);
            setToken(null);
          }
        } catch (err) {
          console.warn('[AuthContext] Échec vérification session :', err.message);
          api.clearSession();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        loading,
        darkMode,
        toggleDarkMode,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
