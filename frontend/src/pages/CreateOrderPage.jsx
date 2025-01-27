
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function CreateOrderPage() {
  const [type, setType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }
    if (!price || price <= 0) {
      toast.error('Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/orders', {
        type,
        amount: Number(amount),
        price: Number(price)
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Order created successfully!');
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      console.error('Create order error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to create order. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Create New Order
          </h1>
          
          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">Order Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setType('buy')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                  type === 'buy'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setType('sell')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium ${
                  type === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2">
              Price (USDT)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter price in USDT"
              min="0"
              step="0.01"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-bold text-white ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CreateOrderPage;
