import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  icon?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  iconRight?: React.ReactNode;
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      icon,
      leadingIcon,
      iconRight,
      error = false,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    const activeLeadingIcon = icon || leadingIcon;
    const sizeStyles = {
      sm: 'h-7 text-xs py-1',
      md: 'h-8 text-[13px] py-1.5',
      lg: 'h-9 text-sm py-2',
    }[size];

    const paddingStyles = `${activeLeadingIcon ? 'pl-8' : 'pl-2.5'} ${iconRight ? 'pr-8' : 'pr-2.5'}`;

    return (
      <div className="relative flex items-center w-full">
        {activeLeadingIcon && (
          <div className="absolute left-2.5 pointer-events-none text-slate-400 flex items-center justify-center shrink-0">
            {activeLeadingIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full rounded-md border transition-desktop font-normal placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900/90 text-slate-100 dark:bg-slate-900/90 dark:text-slate-100 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
              : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40'
          } ${sizeStyles} ${paddingStyles} ${className}`}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-2.5 pointer-events-none text-slate-400 flex items-center justify-center shrink-0">
            {iconRight}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
