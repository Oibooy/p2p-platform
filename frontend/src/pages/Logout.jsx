import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Удаляем токен из локального хранилища
    localStorage.removeItem('token');

    // Перенаправляем на страницу входа
    navigate('/login');
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <h1 className="text-lg font-bold">Logging out...</h1>
    </div>
  );
}

export default Logout;
