import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrderDetails } from '../api/apiClient';

function OrderDetailsPage() {
  const { id } = useParams(); // Получаем ID ордера из URL
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        const data = await fetchOrderDetails(id);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <div className="p-4 bg-white shadow rounded">
        <p><strong>ID:</strong> {order.id}</p>
        <p><strong>Type:</strong> {order.type === 'buy' ? 'Buy Order' : 'Sell Order'}</p>
        <p><strong>Amount:</strong> {order.amount}</p>
        <p><strong>Price:</strong> {order.price} USDT</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Description:</strong> {order.description || 'No description available'}</p>
        {order.user && (
          <p><strong>User:</strong> {order.user.username || 'Unknown'}</p>
        )}
      </div>
    </div>
  );
}

export default OrderDetailsPage;

