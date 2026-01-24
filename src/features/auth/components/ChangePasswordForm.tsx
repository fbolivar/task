'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Lock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ChangePasswordForm() {
    const { user, updatePassword } = useAuth();
    const { t, ...settings } = useSettings();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const passwordRequirements = [
        { met: password.length >= 6, text: 'Mínimo 6 caracteres' },
        { met: password === confirmPassword && confirmPassword.length > 0, text: 'Las contraseñas coinciden' },
    ];

    const isValid = passwordRequirements.every(r => r.met);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isValid) {
            setError('Por favor cumple todos los requisitos de la contraseña');
            return;
        }

        try {
            setLoading(true);

            // 1. Update password in Supabase Auth
            await updatePassword(password);

            // 2. Clear must_change_password flag
            if (user) {
                const supabase = createClient();
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ must_change_password: false })
                    .eq('id', user.id);

                if (profileError) {
                    console.error('Error updating profile:', profileError);
                }
            }

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Error al cambiar la contraseña');
            } else {
                setError('Error desconocido al cambiar la contraseña');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">¡Contraseña Actualizada!</h2>
                    <p className="text-muted-foreground">Redirigiendo al dashboard...</p>
                    <div className="w-8 h-8 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${settings.header_color}, ${settings.header_color}dd, #000000)` }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-40 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>

                {/* Center Content */}
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2 text-white/80">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Seguridad</span>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight">
                        Actualiza tu<br />
                        <span className="text-white/80">contraseña</span>
                    </h2>
                    <p className="text-white/60 text-lg max-w-md leading-relaxed">
                        Por seguridad, es necesario que cambies tu contraseña temporal antes de continuar.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <p className="text-white/40 text-sm">{settings.footer_text}</p>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
                {/* Mobile Header */}
                <div className="lg:hidden p-6 flex items-center gap-3" style={{ backgroundColor: settings.header_color }}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-lg">{settings.app_name.charAt(0)}</span>
                        )}
                    </div>
                    <h1 className="text-white font-bold text-lg">{settings.app_name}</h1>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                    <div className="w-full max-w-md space-y-8">
                        {/* Header */}
                        <div className="text-center flex flex-col items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 border border-amber-200 dark:border-amber-800 flex items-center justify-center shadow-sm">
                                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Cambio de Contraseña</h2>
                                <p className="text-muted-foreground text-sm font-medium">Crea una contraseña segura para tu cuenta</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-rose-500">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-bold text-foreground">
                                    Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-bold text-foreground">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Requirements */}
                            <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Requisitos</p>
                                {passwordRequirements.map((req, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                            {req.met && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm ${req.met ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}`}>
                                            {req.text}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !isValid}
                                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
                                style={{
                                    backgroundColor: settings.header_color,
                                    boxShadow: `0 10px 40px ${settings.header_color}40`
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        Cambiar Contraseña
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden p-6 text-center">
                    <p className="text-muted-foreground text-xs">{settings.footer_text}</p>
                </div>
            </div>
        </div>
    );
}
