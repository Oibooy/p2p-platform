
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

export default function DisputePage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await apiClient.get('/api/disputes');
      setDisputes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      setLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId, resolution) => {
    try {
      await apiClient.post(`/api/disputes/${disputeId}/resolve`, { resolution });
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Disputes</h1>
      
      <div className="grid gap-6">
        {disputes.map((dispute) => (
          <div key={dispute._id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">Dispute #{dispute._id}</h3>
                <p className="text-gray-600 mt-2">{dispute.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                dispute.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' :
                dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {dispute.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <p className="font-medium">{dispute.creator.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created at</p>
                <p className="font-medium">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {dispute.status === 'OPEN' && (
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => handleResolveDispute(dispute._id, 'BUYER_FAVOR')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Resolve for Buyer
                </button>
                <button
                  onClick={() => handleResolveDispute(dispute._id, 'SELLER_FAVOR')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Resolve for Seller
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
