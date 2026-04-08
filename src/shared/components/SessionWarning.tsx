'use client';

import { AlertTriangle, X } from 'lucide-react';

interface SessionWarningProps {
    onContinue: () => void;
    onDismiss: () => void;
}

export function SessionWarning({ onContinue, onDismiss }: SessionWarningProps) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 pointer-events-none"
        >
            <div className="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-700 shadow-lg shadow-amber-500/10 backdrop-blur-sm animate-reveal max-w-lg w-full">
                {/* Icon */}
                <AlertTriangle
                    className="w-5 h-5 text-amber-500 shrink-0"
                    aria-hidden="true"
                />

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Tu sesion expirara en 5 minutos por inactividad
                    </p>
                </div>

                {/* Continue button */}
                <button
                    type="button"
                    onClick={onContinue}
                    className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                >
                    Haz clic para continuar
                </button>

                {/* Dismiss */}
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Cerrar advertencia de sesion"
                    className="shrink-0 p-1 rounded-lg text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
