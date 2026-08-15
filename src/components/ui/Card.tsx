import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  selected = false,
  className = '',
  ...props
}) => {
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-slate-600 hover:bg-slate-850/80 active:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50'
    : '';

  const selectedStyles = selected
    ? 'border-indigo-500/70 bg-indigo-950/20'
    : 'border-slate-800/90 bg-slate-900/80';

  return (
    <div
      className={`rounded-lg border p-3.5 transition-desktop ${selectedStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
