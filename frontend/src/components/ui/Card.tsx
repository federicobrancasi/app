import React from 'react';

export const Card: React.FC<{ className?: string }> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-6 space-y-4 ${className}`}
    >
      {children}
    </div>
  );
};
