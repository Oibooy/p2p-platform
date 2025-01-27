
import React from 'react';

export const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Trade Smarter Together:
              <span className="text-yellow-500 block">The P2P Trading Revolution</span>
              Begins.
            </h1>
            <p className="text-gray-600 mb-8">
              Secure and fast transactions
            </p>
          </div>
          <div className="relative">
            <div className="w-64 h-64 animate-float">
              <img src="/bitcoin-icon.svg" alt="Bitcoin" className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
