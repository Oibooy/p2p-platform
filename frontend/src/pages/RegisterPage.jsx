import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [error, setError] = useState(null); // Для отображения ошибок в форме
  const navigate = useNavigate();

  const password = watch('password'); // Получаем пароль для проверки confirmPassword

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/auth/register', data); // Отправка данных на API
      toast.success('Registration successful! Redirecting to login...');
      setError(null); // Очистка ошибок
      setTimeout(() => navigate('/login'), 3000); // Редирект через 3 секунды
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to register. Please try again.';
      setError(errorMessage); // Устанавливаем ошибку
      toast.error(errorMessage); // Отображаем уведомление
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-lg font-bold mb-4">Register</h1>
        {error && <p className="text-red-500">{error}</p>} {/* Ошибка формы */}

        <div className="mb-4">
          <label className="block font-bold">Username</label>
          <input
            type="text"
            {...register('username', { required: 'Username is required' })}
            className="w-full p-2 border rounded"
            placeholder="Enter your username"
          />
          {errors.username && <p className="text-red-500">{errors.username.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-bold">Email</label>
          <input
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Invalid email address',
              },
            })}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-bold">Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
              validate: {
                hasUpperCase: (value) =>
                  /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                hasNumber: (value) =>
                  /[0-9]/.test(value) || 'Password must contain at least one number',
                hasSpecialChar: (value) =>
                  /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'Password must contain at least one special character',
              },
            })}
            className="w-full p-2 border rounded"
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-bold">Confirm Password</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === password || 'Passwords do not match',
            })}
            className="w-full p-2 border rounded"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="text-red-500">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow mt-4 w-full"
        >
          Register
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} /> {/* Уведомления */}
    </div>
  );
}

export default RegisterPage;



