import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      icon,
      iconRight,
      loading = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-desktop cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900';

    const sizeStyles = {
      sm: 'h-7 px-2.5 text-xs gap-1.5',
      md: 'h-8 px-3 text-[13px] gap-2',
      lg: 'h-9 px-4 text-sm gap-2',
    }[size];

    const variantStyles = {
      primary:
        'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow active:bg-indigo-700 border border-indigo-500/50',
      secondary:
        'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 shadow-xs active:bg-slate-800',
      outline:
        'bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 active:bg-slate-800',
      ghost:
        'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 active:bg-slate-800/80',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/50 shadow-sm active:bg-rose-700',
      subtle:
        'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 active:bg-indigo-950/60',
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';
