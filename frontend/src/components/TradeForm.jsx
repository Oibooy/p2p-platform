import React from 'react';

export default function TradeForm() {
  return (
    <div className="trade-form">
      <h2>Start Trading</h2>
      <form>
        <input type="text" placeholder="Amount" />
        <button type="submit">Trade Now</button>
      </form>
    </div>
  );
}