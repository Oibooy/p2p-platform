
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
import React from 'react';

export default function Hero() {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trade Smarter Together:
              <span className="text-amber-500"> The P2P</span> Trading Revolution
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Exchange safely with confidence
            </p>
            <button className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition duration-300">
              Start Trading
            </button>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-amber-500/10 rounded-full animate-pulse"></div>
              <img src="/bitcoin-icon.svg" alt="Bitcoin" className="relative z-10 w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
