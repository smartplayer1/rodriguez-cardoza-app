import React, { useState } from 'react';

interface MaterialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function MaterialInput({
  label,
  helperText,
  error = false,
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  disabled = false,
  ...props
}: MaterialInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const containerClasses = `
    flex flex-col gap-1
    ${fullWidth ? 'w-full' : ''}
  `;

  const inputWrapperClasses = `
    relative flex items-center gap-2
    border-b-2 transition-colors duration-200
    ${error ? 'border-destructive' : isFocused ? 'border-input-focus' : 'border-border'}
    ${disabled ? 'opacity-50' : ''}
  `;

  const inputClasses = `
    w-full px-3 py-2 bg-transparent
    outline-none transition-all
    ${disabled ? 'cursor-not-allowed' : ''}
    ${className}
  `;

  const labelClasses = `
    text-sm transition-all duration-200
    ${error ? 'text-destructive' : isFocused ? 'text-primary' : 'text-muted-foreground'}
    ${disabled ? 'opacity-50' : ''}
  `;

  const helperTextClasses = `
    text-xs px-3
    ${error ? 'text-destructive' : 'text-muted-foreground'}
  `;

  return (
    <div className={containerClasses}>
      {label && (
        <label className={labelClasses}>
          {label}
        </label>
      )}
      <div className={inputWrapperClasses}>
        {startIcon && (
          <span className="flex items-center text-muted-foreground pl-3">
            {startIcon}
          </span>
        )}
        <input
          className={inputClasses}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {endIcon && (
          <span className="flex items-center text-muted-foreground pr-3">
            {endIcon}
          </span>
        )}
      </div>
      {helperText && (
        <span className={helperTextClasses}>
          {helperText}
        </span>
      )}
    </div>
  );
}
