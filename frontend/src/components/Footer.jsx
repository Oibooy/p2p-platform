
import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Trading Platform</h3>
          <p className="text-gray-300">Secure P2P Trading Platform for your crypto needs</p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link to="/orders" className="text-gray-300 hover:text-white">Orders</Link></li>
            <li><Link to="/login" className="text-gray-300 hover:text-white">Login</Link></li>
            <li><Link to="/register" className="text-gray-300 hover:text-white">Register</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact</h4>
          <ul className="text-gray-300 space-y-2">
            <li>Email: support@platform.com</li>
            <li>Telegram: @platform_support</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
