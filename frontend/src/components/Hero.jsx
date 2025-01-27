
import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="hero bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to Our Platform</h1>
        <p className="text-xl md:text-2xl mb-8">Secure P2P Trading Platform</p>
        <Link to="/register" className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
          Start Trading Now
        </Link>
      </div>
    </div>
  );
}

export default Hero;
