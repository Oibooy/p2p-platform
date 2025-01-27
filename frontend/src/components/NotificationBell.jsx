
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  return (
    <div className="notification-wrapper relative">
      <button
        className="notification-btn p-2 relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <i className="fas fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-popup absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="notification-header p-4 border-b">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Уведомления</span>
              <Link to="/notifications" className="text-sm text-blue-500 hover:text-blue-600">
                Все уведомления
              </Link>
            </div>
          </div>
          <div className="notification-list max-h-96 overflow-y-auto p-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="notification-item p-3 hover:bg-gray-50 rounded-lg mb-2"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Нет новых уведомлений</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
