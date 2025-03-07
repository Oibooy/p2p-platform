import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

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

export const connectWebSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=Bearer ${encodeURIComponent(token)}`;

  const ws = new WebSocket(wsUrl);

  ws.onclose = () => {
    setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
  };

  return ws;
};