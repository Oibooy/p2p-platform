import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Настраиваем базовый клиент
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен в заголовки, если он существует
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

// Методы API
export const fetchOrders = async () => {
  const response = await apiClient.get('/orders'); // Публичный маршрут
  return response.data;
};

export const fetchOrderDetails = async (id) => {
  const response = await apiClient.get(`/orders/${id}`); // Защищённый маршрут
  return response.data;
};

export const createOrder = async (data) => {
  const response = await apiClient.post('/orders', data); // Защищённый маршрут
  return response.data;
};

export const updateOrder = async (id, data) => {
  const response = await apiClient.patch(`/orders/${id}`, data); // Защищённый маршрут
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await apiClient.delete(`/orders/${id}`); // Защищённый маршрут
  return response.data;
};

export const registerUser = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const confirmEmail = async (token) => {
  const response = await apiClient.get(`/auth/confirm-email/${token}`);
  return response.data;
};

export const resendConfirmationEmail = async (email) => {
  const response = await apiClient.post('/auth/resend-confirmation', { email });
  return response.data;
};

