import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  className?: string;
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'xl',
  className = '',
  ariaLabel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-6xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === 'string' ? title : 'Modal Dialog')}
    >
      <div
        ref={dialogRef}
        className={`bg-slate-900 border border-slate-700/80 text-slate-100 rounded-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto ${maxWidthStyles} ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="text-indigo-400 shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white tracking-tight truncate">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-desktop cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/60 shrink-0 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
