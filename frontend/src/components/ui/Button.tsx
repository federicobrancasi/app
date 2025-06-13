import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg';
};

export const Button: React.FC<ButtonProps> = ({
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  } as const;

  return (
    <button
      {...props}
      className={`
        inline-block font-medium rounded-lg shadow
        bg-blue-600 text-white hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
};
