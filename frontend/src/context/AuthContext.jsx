import { createContext, useState, useEffect } from 'react';

// Создаём контекст
export const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Хранение данных о пользователе
  const [loading, setLoading] = useState(true); // Состояние загрузки

  // Проверяем токен в localStorage при загрузке приложения
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Здесь можно добавить логику проверки токена на сервере
      const userData = parseToken(token); // Пример: декодирование токена (если JWT)
      setUser(userData);
      setIsAuthenticated(true);
    }
    setLoading(false); // Загрузка завершена
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    const userData = parseToken(token); // Декодирование токена
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const parseToken = (token) => {
    // Пример декодирования JWT. Можно использовать библиотеку jwt-decode
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to parse token', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
