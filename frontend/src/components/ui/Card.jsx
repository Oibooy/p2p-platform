
import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  shadow = 'md',
  padding = 'normal'
}) => {
  const shadows = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const paddings = {
    none: 'p-0',
    small: 'p-3',
    normal: 'p-4',
    large: 'p-6'
  };

  return (
    <div className={`
      bg-white rounded-lg 
      ${shadows[shadow]}
      ${paddings[padding]}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default Card;
