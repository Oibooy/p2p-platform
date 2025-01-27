
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Username</th>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Role</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-4 py-2 border">{user.username}</td>
                <td className="px-4 py-2 border">{user.email}</td>
                <td className="px-4 py-2 border">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-2 border">
                  <select
                    value={user.isActive ? 'active' : 'inactive'}
                    onChange={(e) => handleStatusChange(user._id, e.target.value)}
                    className="border rounded p-1"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td className="px-4 py-2 border">
                  <button
                    onClick={() => handleStatusChange(user._id, user.isActive ? 'inactive' : 'active')}
                    className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
