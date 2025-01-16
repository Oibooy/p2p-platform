import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);

  const onSubmit = async (data) => {
    try {
      const response = await apiClient.post('/auth/login', data); // Авторизация через API
      toast.success('Login successful!');
      localStorage.setItem('token', response.data.token); // Сохраняем токен в локальное хранилище
      setError(null); // Очистка ошибок
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to login. Please try again.';
      setError(errorMessage); // Устанавливаем ошибку
      toast.error(errorMessage); // Уведомление об ошибке
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-lg font-bold mb-4">Login</h1>
        {error && <p className="text-red-500">{error}</p>} {/* Ошибка формы */}

        <div className="mb-4">
          <label className="block font-bold">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="w-full p-2 border rounded"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}
        </div>

        <div className="mb-4">
          <label className="block font-bold">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full p-2 border rounded"
            placeholder="Enter your password"
          />
          {errors.password && <p className="text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow mt-4 w-full"
        >
          Login
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} /> {/* Уведомления */}
    </div>
  );
}

export default LoginPage;


