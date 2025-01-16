import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, deleteOrder } from '../api/apiClient';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await deleteOrder(id);
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
      alert('Order deleted successfully.');
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <button
        onClick={() => navigate('/orders/create')}
        className="bg-green-500 text-white px-4 py-2 rounded shadow mb-4"
      >
        Create New Order
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 bg-white shadow rounded">
            <h2 className="text-lg font-bold">{order.type === 'buy' ? 'Buy Order' : 'Sell Order'}</h2>
            <p>Amount: {order.amount}</p>
            <p>Price: {order.price} USDT</p>
            <p>Status: {order.status}</p>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                View
              </button>
              <button
                onClick={() => navigate(`/orders/edit/${order.id}`)}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(order.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrdersPage;





