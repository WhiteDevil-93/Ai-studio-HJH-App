import React from 'react';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  ariaLabel = 'Select option',
}: SegmentedControlProps<T>) {
  const containerSizeStyles = {
    sm: 'p-0.5 gap-0.5 rounded-md text-xs',
    md: 'p-1 gap-1 rounded-md text-[13px]',
  }[size];

  const itemSizeStyles = {
    sm: 'px-2 py-0.5 min-h-[24px]',
    md: 'px-3 py-1 min-h-[28px]',
  }[size];

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-slate-900 border border-slate-700/80 ${containerSizeStyles} ${className}`}
    >
      {options.map(opt => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            aria-pressed={isSelected}
            className={`flex items-center justify-center gap-1.5 font-medium rounded transition-desktop cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${itemSizeStyles} ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
