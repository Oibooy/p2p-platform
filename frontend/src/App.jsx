import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import OrdersPage from './pages/OrdersPage';
import CreateOrderPage from './pages/CreateOrderPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import EditOrderPage from './pages/EditOrderPage';
import LoginPage from './pages/LoginPage';
import Logout from './pages/Logout';
import RegisterPage from './pages/RegisterPage';
import ConfirmEmailPage from './pages/ConfirmEmailPage';
import ResendConfirmationPage from './pages/ResendConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute'; // Подключаем ProtectedRoute

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <main className="p-4">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/confirm-email/:token" element={<ConfirmEmailPage />} />
              <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
              <Route path="/" element={<OrdersPage />} />

              {/* Защищённые маршруты */}                                                                                 
              <Route
                path="/orders/create"
                element={
                  <ProtectedRoute>
                    <CreateOrderPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/edit/:id"
                element={
                  <ProtectedRoute>
                    <EditOrderPage />
                  </ProtectedRoute>
                }
              />

              {/* Маршрут 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;



