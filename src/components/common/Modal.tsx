import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1a1c1a]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Dialog Wrapper */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-2 sm:p-4 text-left">
        <div
          className={`w-full ${maxWidthClass} transform bg-[#fdfcf9] border-2 border-[#1a1c1a] neo-shadow-lg transition-all overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* Header matching Variation 2 */}
          <div className="px-5 py-4 border-b-2 border-[#1a1c1a] flex items-center justify-between bg-[#fdfcf9]">
            <div className="min-w-0 pr-3">
              {subtitle && (
                <span className="status-badge mb-1 block">
                  {subtitle}
                </span>
              )}
              <h3 className="font-syne text-lg sm:text-xl font-bold text-[#1a1c1a] tracking-tight leading-tight truncate">
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold font-mono-custom border-[1.5px] border-[#1a1c1a] text-[#1a1c1a] hover:bg-[#1a1c1a] hover:text-[#fdfcf9] transition-colors shrink-0 uppercase"
              aria-label="Tutup jendela"
            >
              CLOSE [X]
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs sm:text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};
