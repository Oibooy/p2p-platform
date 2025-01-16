import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrderDetails, updateOrder } from '../api/apiClient';

function EditOrderPage() {
  const { id } = useParams(); // Получаем ID ордера из URL
  console.log('Order ID:', id); // Добавьте эту строку для отладки
  const navigate = useNavigate();

  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        const data = await fetchOrderDetails(id);
        setType(data.type);
        setAmount(data.amount);
        setPrice(data.price);
        setStatus(data.status);
      } catch (err) {
        console.error('Error loading order details:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateOrder(id, { type, amount, price, status });
      setMessage('Order updated successfully.');
      setTimeout(() => navigate('/'), 2000); // Перенаправление на главную страницу через 2 секунды
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order. Please try again.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Edit Order</h1>
      {message && <p className="text-green-500">{message}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-bold">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>
        <div>
          <label className="block font-bold">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block font-bold">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block font-bold">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 border rounded w-full"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Update Order
        </button>
      </form>
    </div>
  );
}

export default EditOrderPage;
