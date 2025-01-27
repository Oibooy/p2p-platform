
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
import React from 'react';

export default function TradeForm() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 border rounded-lg p-3">
            <img src="/currency-icon.svg" alt="" className="w-6 h-6" />
            <select className="w-full bg-transparent outline-none">
              <option>USD</option>
              <option>EUR</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-3">
            <input 
              type="number" 
              placeholder="Amount" 
              className="w-full outline-none"
            />
          </div>
          <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition duration-300">
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
