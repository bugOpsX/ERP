import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication session on application startup
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res && res.authenticated) {
        setUser(res.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.warn('Session verification check failed:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Axios 401 Interceptor: Auto-logout when session expires
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // If request is not already the login check or login submission
          const url = error.config?.url || '';
          if (!url.includes('/auth/login') && !url.includes('/auth/me')) {
            setUser(null);
            setIsAuthenticated(false);
            if (window.location.hash !== '#login') {
              window.location.hash = '#login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (username, password) => {
    const res = await authService.login(username, password);
    if (res && res.success) {
      setUser(res.user);
      setIsAuthenticated(true);
      return res;
    }
    throw new Error(res?.message || 'Invalid administrator credentials.');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout request warning:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      window.location.hash = '#login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
