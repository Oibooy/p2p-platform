
import React from 'react';

const FeatureCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6">
    <div className="w-16 h-16 mb-4">
      {icon}  
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export function Features() {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-12">
          Explore fast crypto solutions for
          <span className="text-purple-600"> every trader's need</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<svg className="w-full h-full text-green-500" viewBox="0 0 24 24" fill="currentColor"/>}
            title="Register"
            description="Fill in your details to create a free P2P account. You'll be ready to trade in no time."
          />
          <FeatureCard
            icon={<svg className="w-full h-full text-green-500" viewBox="0 0 24 24" fill="currentColor"/>}
            title="Verify Your Identity"
            description="Complete the verification process to unlock all trading features."
          />
          <FeatureCard
            icon={<svg className="w-full h-full text-green-500" viewBox="0 0 24 24" fill="currentColor"/>}
            title="Start Your Trade"
            description="Browse available offers and start trading with verified users."
          />
        </div>
      </div>
    </div>
  );
};
