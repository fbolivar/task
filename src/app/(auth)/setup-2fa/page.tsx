'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { MFAEnrollment } from '@/features/auth/components/MFAEnrollment';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';

export default function Setup2FAPage() {
    const router = useRouter();
    const supabase = createClient();
    const settings = useSettings();

    const handleSuccess = () => {
        // Redirect to dashboard after successful enrollment
        router.push('/dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-6">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-105 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${settings.header_color}, ${settings.header_color}dd)`,
                                boxShadow: `0 8px 16px -4px ${settings.header_color}40`
                            }}
                        >
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-2xl">{settings.app_name.charAt(0)}</span>
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Configuración de Seguridad Requerida
                    </h1>
                    <p className="text-slate-500 text-sm">
                        Para continuar, es obligatorio activar la autenticación de dos factores (2FA).
                    </p>
                </div>

                <MFAEnrollment onSuccess={handleSuccess} />

                <div className="text-center">
                    <button
                        onClick={handleLogout}
                        className="text-sm font-medium text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2 mx-auto"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
