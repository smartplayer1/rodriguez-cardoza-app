import React from 'react';

interface MaterialCardProps {
  children: React.ReactNode;
  elevation?: 1 | 2 | 3 | 4 | 5;
  className?: string;
  padding?: boolean;
}

export function MaterialCard({
  children,
  elevation = 2,
  className = '',
  padding = true,
}: MaterialCardProps) {
  const baseClasses = `
    bg-surface rounded
    transition-shadow duration-200
    ${padding ? 'p-6' : ''}
  `;

  const elevationClass = `elevation-${elevation}`;

  return (
    <div className={`${baseClasses} ${elevationClass} ${className}`}>
      {children}
    </div>
  );
}

interface MaterialCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MaterialCardHeader({ children, className = '' }: MaterialCardHeaderProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

interface MaterialCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MaterialCardContent({ children, className = '' }: MaterialCardContentProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

interface MaterialCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MaterialCardActions({ children, className = '' }: MaterialCardActionsProps) {
  return (
    <div className={`mt-4 flex gap-2 ${className}`}>
      {children}
    </div>
  );
}
