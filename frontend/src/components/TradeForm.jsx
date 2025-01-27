
import React, { useState } from 'react';

export default function TradeForm() {
  const [tradeType, setTradeType] = useState('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [crypto, setCrypto] = useState('USDT');

  return (
    <div className="trade-form max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Start Trading</h2>
      <form className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className={`flex-1 py-2 rounded ${tradeType === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTradeType('buy')}
          >
            Buy
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setTradeType('sell')}
          >
            Sell
          </button>
        </div>
        
        <select
          className="w-full p-2 border rounded"
          value={crypto}
          onChange={(e) => setCrypto(e.target.value)}
        >
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>

        <input
          type="number"
          placeholder="Amount"
          className="w-full p-2 border rounded"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="number"
          placeholder="Price"
          className="w-full p-2 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-3 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
        </button>
      </form>
    </div>
  );
}
