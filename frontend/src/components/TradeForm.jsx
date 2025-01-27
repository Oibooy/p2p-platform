
import React from 'react';

export const TradeForm = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
              <option>USDT</option>
            </select>
          </div>
          <div>
            <input 
              type="number" 
              placeholder="Amount" 
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <input 
              type="text" 
              placeholder="Payment method" 
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
