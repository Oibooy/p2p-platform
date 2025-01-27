
import React from 'react';

const Alert = ({ 
  type = 'info', 
  message, 
  onClose 
}) => {
  const types = {
    success: 'bg-green-100 text-green-800 border-green-400',
    error: 'bg-red-100 text-red-800 border-red-400',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    info: 'bg-blue-100 text-blue-800 border-blue-400'
  };

  return (
    <div className={`border-l-4 p-4 ${types[type]}`} role="alert">
      <div className="flex justify-between items-center">
        <div className="flex-1">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
