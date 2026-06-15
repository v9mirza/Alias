import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-secondaryText">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2.5 rounded-lg bg-card border border-border text-primaryText text-sm transition-all placeholder:text-[#52525b] focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 ${
            error ? 'border-red-900 focus:border-red-800 focus:ring-red-900/40' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs font-mono text-red-500 uppercase tracking-tight">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
