import React from 'react';

interface MaterialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'error';
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export function MaterialButton({
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  startIcon,
  endIcon,
  children,
  className = '',
  disabled = false,
  ...props
}: MaterialButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 px-4 py-2
    rounded transition-all duration-200 outline-none
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantStyles = {
    contained: {
      primary: `
        bg-primary text-primary-foreground
        hover:shadow-md hover:brightness-110
        active:shadow-lg
        focus:ring-primary/50
      `,
      secondary: `
        bg-secondary text-secondary-foreground
        hover:shadow-md hover:brightness-110
        active:shadow-lg
        focus:ring-secondary/50
      `,
      error: `
        bg-destructive text-destructive-foreground
        hover:shadow-md hover:brightness-110
        active:shadow-lg
        focus:ring-destructive/50
      `,
    },
    outlined: {
      primary: `
        bg-transparent text-primary border-2 border-primary
        hover:bg-primary/10
        active:bg-primary/20
        focus:ring-primary/50
      `,
      secondary: `
        bg-transparent text-secondary border-2 border-secondary
        hover:bg-secondary/10
        active:bg-secondary/20
        focus:ring-secondary/50
      `,
      error: `
        bg-transparent text-destructive border-2 border-destructive
        hover:bg-destructive/10
        active:bg-destructive/20
        focus:ring-destructive/50
      `,
    },
    text: {
      primary: `
        bg-transparent text-primary
        hover:bg-primary/10
        active:bg-primary/20
        focus:ring-primary/50
      `,
      secondary: `
        bg-transparent text-secondary
        hover:bg-secondary/10
        active:bg-secondary/20
        focus:ring-secondary/50
      `,
      error: `
        bg-transparent text-destructive
        hover:bg-destructive/10
        active:bg-destructive/20
        focus:ring-destructive/50
      `,
    },
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant][color]} ${widthStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
}
