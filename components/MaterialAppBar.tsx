import React from 'react';

interface MaterialAppBarProps {
  children: React.ReactNode;
  className?: string;
}

export function MaterialAppBar({ children, className = '' }: MaterialAppBarProps) {
  return (
    <header className={`bg-primary text-primary-foreground px-6 py-4 elevation-3 ${className}`}>
      <div className="flex items-center justify-between">
        {children}
      </div>
    </header>
  );
}

interface MaterialToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function MaterialToolbar({ children, className = '' }: MaterialToolbarProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {children}
    </div>
  );
}
