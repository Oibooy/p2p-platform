import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; // Added import for Link
import { AuthContext } from '../context/AuthContext';

function Header() {
  const { isAuthenticated, user, logout } = useContext(AuthContext); // Added 'user' to context
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <h1
            className="text-2xl font-bold cursor-pointer hover:text-blue-200 transition-colors"
            onClick={() => navigate('/')}
          >
            Trading Platform
          </h1>
          <nav className="flex items-center space-x-4">
            {isAuthenticated && user && ( // Added user check
              <>
                {user.role === 'admin' && ( // Added admin role check
                  <Link to="/admin" className="text-white hover:text-gray-300 mr-4">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => navigate('/orders/create')}
                  className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition-colors"
                >
                  Create Order
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-500 hover:bg-blue-400 px-4 py-2 rounded-lg transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
                >
                  Register
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;