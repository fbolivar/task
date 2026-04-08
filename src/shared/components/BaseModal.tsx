'use client';

import { ReactNode, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    header?: ReactNode;
    title?: string;
    subtitle?: string;
    icon?: ReactNode;
    headerClassName?: string;
}

const MAX_WIDTH_MAP = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
};

export function BaseModal({
    isOpen,
    onClose,
    children,
    maxWidth = '2xl',
    header,
    title,
    subtitle,
    icon,
    headerClassName = 'bg-slate-50 dark:bg-slate-950/50',
}: BaseModalProps) {
    const handleEscape = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`bg-white dark:bg-slate-900 w-full ${MAX_WIDTH_MAP[maxWidth]} max-h-[90vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300`}>
                {/* Header */}
                {header || (title && (
                    <div className={`p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between ${headerClassName}`}>
                        <div className="flex items-center gap-3">
                            {icon && (
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    {icon}
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-lg text-foreground">{title}</h3>
                                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                            </div>
                        </div>
                        <button
                            type="button"
                            title="Cerrar"
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                ))}

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
