import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.get('/users/me')
        .then(({ data }) => {
          localStorage.setItem('user', JSON.stringify(data));
          setUser(data);
        })
        .catch((error) => {
          if ([401, 403].includes(error.response?.status)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const required = Array.isArray(permission) ? permission : [permission];
    return required.some((key) => user.permissions?.includes(key));
  };

  const hasAnyPermission = (permissions) => permissions.some((permission) => hasPermission(permission));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, hasRole, hasPermission, hasAnyPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
