import React, { createContext, useState, useContext } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null); // Added state for auth data

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data && response.data.token) {
        setAuthData(response.data);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        return response.data;
      }
      throw new Error('Invalid login response');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 'Invalid email or password';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setAuthData(null); // Clear auth data on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };