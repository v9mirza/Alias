import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-2">
        {label && (
          <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-secondaryText">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full min-h-11 px-4 py-2.5 rounded-xl bg-card border border-border text-primaryText text-sm transition-all placeholder:text-[#66788f] focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 ${
            error ? 'border-red-900 focus:border-red-800 focus:ring-red-900/40' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-[11px] font-mono text-red-400 uppercase tracking-tight">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
