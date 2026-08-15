import React from 'react';
import { ChevronDown } from 'lucide-react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  icon?: React.ReactNode;
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      children,
      size = 'md',
      icon,
      error = false,
      disabled,
      className = '',
      ...props
    },
    ref,
  ) => {
    const sizeStyles = {
      sm: 'h-7 text-xs py-1',
      md: 'h-8 text-[13px] py-1.5',
      lg: 'h-9 text-sm py-2',
    }[size];

    const paddingLeft = icon ? 'pl-8' : 'pl-2.5';

    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-2.5 pointer-events-none text-slate-400 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={`w-full appearance-none rounded-md border transition-desktop font-normal pr-8 disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900/90 text-slate-100 dark:bg-slate-900/90 dark:text-slate-100 ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
          } focus:outline-none cursor-pointer ${sizeStyles} ${paddingLeft} ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-2.5 pointer-events-none text-slate-400 flex items-center justify-center">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  },
);

Select.displayName = 'Select';
