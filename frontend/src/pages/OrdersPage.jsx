
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, deleteOrder } from '../api/apiClient';
import { toast } from 'react-toastify';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
      toast.success('Orders loaded successfully');
    } catch (err) {
      setError('Failed to load orders. Please try again.');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await deleteOrder(id);
      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== id));
      toast.success('Order deleted successfully');
    } catch (err) {
      console.error('Error deleting order:', err);
      toast.error('Failed to delete order');
    }
  };

  const filteredOrders = orders
    .filter(order => filterStatus === 'all' ? true : order.status === filterStatus)
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'highPrice') return b.price - a.price;
      return a.price - b.price;
    });

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {order.type === 'buy' ? '🔵' : '🔴'}
          <span className="capitalize">{order.type} Order #{order.id}</span>
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm ${
          order.status === 'active' ? 'bg-green-100 text-green-800' :
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {order.status}
        </span>
      </div>
      <div className="space-y-2 mb-4">
        <p className="text-gray-600">Amount: <span className="font-medium">{order.amount}</span></p>
        <p className="text-gray-600">Price: <span className="font-medium">{order.price} USDT</span></p>
        <p className="text-gray-600 text-sm">Created: {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          View
        </button>
        <button
          onClick={() => navigate(`/orders/edit/${order.id}`)}
          className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(order.id)}
          className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <button
          onClick={() => navigate('/orders/create')}
          className="w-full sm:w-auto bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Create New Order
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highPrice">Highest Price</option>
          <option value="lowPrice">Lowest Price</option>
        </select>
      </div>

      {error ? (
        <div className="text-center p-4">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;
