
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
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6 border border-gray-200/20">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          {order.type === 'buy' ? 
            <span className="text-blue-500 text-2xl">⬇️</span> : 
            <span className="text-red-500 text-2xl">⬆️</span>
          }
          <span className="capitalize">{order.type} Order #{order.id}</span>
        </h2>
        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${
          order.status === 'active' ? 'bg-green-500/20 text-green-300' :
          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
          'bg-red-500/20 text-red-300'
        }`}>
          {order.status}
        </span>
      </div>
      <div className="space-y-3 mb-6">
        <p className="text-gray-300 flex justify-between">
          <span>Amount:</span>
          <span className="font-medium">{order.amount}</span>
        </p>
        <p className="text-gray-300 flex justify-between">
          <span>Price:</span>
          <span className="font-medium">{order.price} USDT</span>
        </p>
        <p className="text-gray-400 text-sm flex justify-between">
          <span>Created:</span>
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => navigate(`/orders/${order.id}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          View
        </button>
        <button
          onClick={() => navigate(`/orders/edit/${order.id}`)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors duration-200"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(order.id)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Orders
        </h1>
        <button
          onClick={() => navigate('/orders/create')}
          className="w-full sm:w-auto bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-lg"
        >
          Create New Order
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 rounded-lg bg-white/10 border border-gray-200/20 backdrop-blur-lg text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-3 rounded-lg bg-white/10 border border-gray-200/20 backdrop-blur-lg text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highPrice">Highest Price</option>
          <option value="lowPrice">Lowest Price</option>
        </select>
      </div>

      {error ? (
        <div className="text-center p-8 bg-red-500/10 rounded-xl backdrop-blur-lg">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl backdrop-blur-lg">
          <p className="text-gray-400 text-lg">No orders found</p>
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
