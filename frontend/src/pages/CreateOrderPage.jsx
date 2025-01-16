import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import apiClient from '../api/apiClient';

function CreateOrderPage() {
  const [type, setType] = useState('buy'); // Тип ордера: buy или sell
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await apiClient.post('/orders', { type, amount, price });
      console.log(response.data); // Используйте данные из ответа
      toast.success('Order created successfully!');
      setTimeout(() => navigate('/'), 3000); // Редирект на страницу со списком ордеров
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to create order. Please try again.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-96">
        <h1 className="text-lg font-bold mb-4">Create Order</h1>
        <div className="mb-4">
          <label className="block font-bold">Order Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-bold">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-bold">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter price"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded shadow w-full"
        >
          Create Order
        </button>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default CreateOrderPage;

