// src/components/ui/Card.tsx
import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true 
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  
  const variants = {
    default: 'bg-white border border-gray-100 shadow-lg',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl',
  } as const;

  const hoverClasses = hover ? 'hover:shadow-2xl hover:-translate-y-1' : '';

  return (
    <div
      className={clsx(
        baseClasses,
        variants[variant],
        hoverClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

// Default export for backwards compatibility
export default Card;