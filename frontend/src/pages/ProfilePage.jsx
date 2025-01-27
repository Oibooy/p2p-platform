
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    email: '',
    username: '',
    rating: 0,
    deals: 0,
    reviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get(`/api/users/profile`);
        setProfile(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{profile.username}</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{profile.email}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{profile.rating}/5</div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Completed Deals</label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md">{profile.deals}</div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Reviews</h2>
          {profile.reviews.length > 0 ? (
            <div className="space-y-4">
              {profile.reviews.map((review, index) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="text-gray-600">{review.comment}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Rating: {review.rating}/5 • {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
