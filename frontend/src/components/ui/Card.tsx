
// frontend/src/components/ui/Card.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  glass = false 
}) => {
  const baseClasses = glass 
    ? 'glass border rounded-xl'
    : 'bg-gray-800 border border-gray-700 rounded-xl';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2 } : undefined}
      className={`${baseClasses} ${hover ? 'hover:border-gray-600 transition-all duration-200' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
};
