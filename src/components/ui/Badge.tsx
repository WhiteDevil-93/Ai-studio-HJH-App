import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'facility-hjh'
  | 'facility-cmjah'
  | 'facility-rmmch'
  | 'facility-chbah';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-0.5 gap-1.5',
  }[size];

  const variantStyles = {
    neutral: 'bg-slate-800/80 text-slate-300 border border-slate-700/60',
    primary: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    'facility-hjh': 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    'facility-cmjah': 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    'facility-rmmch': 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
    'facility-chbah': 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded uppercase tracking-wider shrink-0 select-none ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
