import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  variant?: 'default' | 'metric' | 'elevated';
}

export function Card({ 
  children, 
  className = '', 
  title, 
  description, 
  footer,
  variant = 'default' 
}: CardProps) {
  const variantClasses = {
    default: 'admin-card',
    metric: 'admin-card admin-metric-card',
    elevated: 'admin-card shadow-lg',
  };

  return (
    <div className={`${variantClasses[variant]} animate-fadeIn ${className}`}>
      {title && (
        <div className="admin-card-header">
          <h3>{title}</h3>
          {description && <p className="text-sm mt-1">{description}</p>}
        </div>
      )}
      <div className="admin-card-body">{children}</div>
      {footer && <div className="admin-card-footer">{footer}</div>}
    </div>
  );
}
