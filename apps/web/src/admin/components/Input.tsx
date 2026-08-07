import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  help?: string;
}

export function Input({ label, error, help, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-admin-text-primary">
          {label}
        </label>
      )}
      <input
        className={`px-4 py-2 border-1.5 rounded-lg text-admin-text-primary bg-admin-bg-primary border-admin-border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
      {help && <span className="text-xs text-secondary">{help}</span>}
    </div>
  );
}
