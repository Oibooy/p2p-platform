import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function ConfirmEmailPage() {
  const { token } = useParams(); // Получаем токен из URL
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const response = await apiClient.get(`/auth/confirm-email/${token}`);
        setMessage(response.data.message || 'Email confirmed successfully.');
        toast.success(response.data.message || 'Email confirmed successfully.');
        setTimeout(() => navigate('/login'), 3000); // Редирект через 3 секунды
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Invalid or expired token.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    };

    confirmEmail();
  }, [token, navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-80 text-center">
        {message && <p className="text-green-500">{message}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ConfirmEmailPage;

