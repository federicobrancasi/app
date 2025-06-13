// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}
    >
      {children}
    </div>
  );
};

// Default export for backwards compatibility
export default Card;