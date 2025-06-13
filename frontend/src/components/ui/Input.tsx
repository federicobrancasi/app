import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      className={`
        block w-full border border-gray-300 rounded-lg px-4 py-2
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${className}
      `}
    />
  )
);

Input.displayName = 'Input';
