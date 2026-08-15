import React from 'react';

export interface SettingRowProps {
  label?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  horizontal?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  title,
  description,
  children,
  className = '',
  horizontal = true,
}) => {
  const displayLabel = label || title;
  return (
    <div
      className={`py-2.5 border-b border-slate-800/80 last:border-0 ${
        horizontal
          ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'
          : 'space-y-1.5'
      } ${className}`}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <label className="text-[13px] font-medium text-slate-200 block">{displayLabel}</label>
        {description && (
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
};
