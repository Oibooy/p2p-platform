
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    const response = await apiClient.post('/api/auth/login', credentials);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await apiClient.post('/api/auth/logout');
    setUser(null);
  };

  const checkAuth = async () => {
    try {
      const response = await apiClient.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
