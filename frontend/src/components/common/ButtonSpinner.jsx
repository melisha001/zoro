import React from 'react';
import InlineSpinner from './InlineSpinner';

export default function ButtonSpinner({
  loading = false,
  children,
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`relative inline-flex items-center justify-center transition-all ${
        loading ? 'cursor-not-allowed opacity-80' : ''
      } ${className}`}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <InlineSpinner size="w-4 h-4" />
        </span>
      )}
      <span className={loading ? 'invisible' : 'inline-flex items-center space-x-2'}>
        {children}
      </span>
    </button>
  );
}
