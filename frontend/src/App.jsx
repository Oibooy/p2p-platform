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
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Hero from './components/Hero';
import TradeForm from './components/TradeForm';
import { Features } from './components/Features';
import ProfilePage from './pages/ProfilePage';
import ReviewsPage from './pages/ReviewsPage';
import './App.css';
import './styles/main.css';
import './styles/theme.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Header />
          <Hero />
          <TradeForm />
          <Features />
          <main className="p-4">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/reviews/:userId" element={<ReviewsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;