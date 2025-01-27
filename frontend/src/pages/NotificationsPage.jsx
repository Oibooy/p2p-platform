
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/api/notifications');
        setNotifications(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load notifications');
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await apiClient.post('/api/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-green-500 hover:text-green-600"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-lg shadow-md p-4 ${
                !notification.isRead ? 'border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">{notification.event}</span>
                <span className="text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">
                {notification.data.message || JSON.stringify(notification.data)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No notifications yet</p>
        )}
      </div>
    </div>
  );
}
