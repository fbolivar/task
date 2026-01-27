'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m15 9-6 6" />
                    <path d="m9 9 6 6" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Algo salió mal!</h2>
            <p className="text-slate-600 mb-8 max-w-md">
                Ocurrió un error inesperado al cargar la aplicación.
                Si el problema persiste, contacta a soporte.
            </p>

            {process.env.NODE_ENV === 'development' && (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-left text-xs mb-8 max-w-lg w-full overflow-auto">
                    <p className="font-bold text-rose-400 mb-2">Detalles Técnicos:</p>
                    <code>{error.message}</code>
                </div>
            )}

            <button
                onClick={() => reset()}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
            >
                Intentar de nuevo
            </button>
        </div>
    );
}
