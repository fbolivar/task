'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, LoginCredentials } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Lock, Mail, ArrowRight, Sparkles, Leaf, Mountain, Droplets } from 'lucide-react';

export function LoginForm() {
    const { signIn, loading } = useAuth();
    const { t, ...settings } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const credentials: LoginCredentials = loginSchema.parse({ email, password });
            await signIn(credentials);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'issues' in err) {
                const zodError = err as { issues: Array<{ message: string }> };
                setError(zodError.issues[0].message);
            } else if (err instanceof Error) {
                setError(err.message || t('auth.loginError'));
            } else {
                setError(t('auth.loginError'));
            }
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError(''); // Clear modal error, not main login error

        try {
            // Import the Server Action for custom password reset flow
            // Note: In Next.js App Router, we can import server actions in Client Components
            const { requestPasswordResetAction } = await import('../actions/resetPasswordAction');

            const result = await requestPasswordResetAction(forgotEmail);

            if (!result.success) {
                throw new Error(result.error || 'Error al enviar el correo');
            }

            setForgotSuccess(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setForgotError(err.message);
            } else {
                setForgotError('Error al enviar solicitud');
            }
        } finally {
            setForgotLoading(false);
        }
    };

    // Use institutional colors from globals.css via Tailwind classes
    const brandName = settings.app_name || 'GestorPro';
    const footerText = settings.footer_text || '© 2024 Parques Nacionales Naturales de Colombia';

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding (Institutional Nature Theme) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-primary via-[#0B4D24] to-secondary text-white">

                {/* Abstract Nature Patterns */}
                <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent rounded-full blur-[120px]" />
                </div>

                {/* Center Content */}
                <div className="relative z-10 space-y-8 mt-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                        <Leaf className="w-4 h-4 text-accent" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/90">{t('auth.tagline') || 'Sistema de Gestión'}</span>
                    </div>

                    <h2 className="text-5xl font-black text-white leading-[1.1] font-heading">
                        {t('auth.headline') || 'Conservación'}<br />
                        <span className="text-white/70">{t('auth.headlineSub') || 'y Biodiversidad'}</span>
                    </h2>

                    <p className="text-white/80 text-lg max-w-md leading-relaxed font-medium">
                        {t('auth.description') || 'Plataforma integrada para la gestión de proyectos, inventarios y tareas operativas en áreas protegidas.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-8">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                            <Mountain className="w-8 h-8 text-white/60 mb-3" />
                            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{t('auth.projects')}</p>
                            <p className="text-white font-bold text-lg">Áreas Protegidas</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                            <Droplets className="w-8 h-8 text-white/60 mb-3" />
                            <p className="text-white/60 text-xs uppercase tracking-widest mb-1">{t('auth.users')}</p>
                            <p className="text-white font-bold text-lg">Recursos Hídricos</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 flex items-center gap-4 text-white/40 text-xs font-medium uppercase tracking-wider">
                    <span className="flex-1 opacity-50">{footerText}</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Colombia.svg/2560px-Flag_of_Colombia.svg.png" alt="Colombia" className="h-4 w-auto opacity-50 grayscale hover:grayscale-0 transition-all" />
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
                {/* Mobile Header */}
                <div className="lg:hidden p-6 bg-primary text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold">
                            {brandName.charAt(0)}
                        </div>
                        <h1 className="font-heading font-bold text-lg">{brandName}</h1>
                    </div>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Leaf className="w-64 h-64 text-primary rotate-45" />
                    </div>

                    <div className="w-full max-w-md space-y-10 relative z-10">
                        {/* Header */}
                        <div className="text-center flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/10">
                                {settings.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                                ) : (
                                    <Leaf className="w-10 h-10 text-primary" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-foreground tracking-tight font-heading">{brandName}</h2>
                                <p className="text-muted-foreground text-base mt-2">{t('auth.enterCredentials')}</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-rose-600 font-bold">!</span>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                    {t('auth.email')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-0 transition-all hover:border-slate-200 dark:hover:border-slate-700"
                                        placeholder={t('auth.emailPlaceholder')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                        {t('auth.password')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => { setShowForgotModal(true); setForgotError(''); }}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-0 transition-all hover:border-slate-200 dark:hover:border-slate-700"
                                        placeholder={t('auth.passwordPlaceholder')}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>{t('auth.loggingIn')}</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{t('auth.loginBtn')}</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Mobile Footer */}
                <div className="lg:hidden p-8 text-center bg-slate-100 dark:bg-slate-900/50">
                    <p className="text-muted-foreground/50 text-xs font-medium uppercase tracking-wider">{footerText}</p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="glass-card w-full max-w-md p-6 space-y-6 m-4 relative bg-white dark:bg-slate-900 shadow-2xl">
                        {!forgotSuccess ? (
                            <>
                                <div>
                                    <h3 className="font-bold text-xl font-heading mb-2">Recuperar Contraseña</h3>
                                    <p className="text-muted-foreground text-sm">
                                        Te enviaremos un enlace seguro para restablecer tu contraseña.
                                    </p>
                                </div>

                                {forgotError && (
                                    <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                        <span className="text-rose-600 font-bold">!</span>
                                        {forgotError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label htmlFor="forgotEmail" className="block text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                                            Correo Electrónico
                                        </label>
                                        <input
                                            id="forgotEmail"
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-primary focus:ring-0"
                                            placeholder="nombre@ejemplo.com"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="flex-1 btn-secondary"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                                        >
                                            {forgotLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                                            Enviar Enlace
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-xl font-heading mb-2 text-emerald-600">¡Correo Enviado!</h3>
                                <p className="text-muted-foreground text-sm mb-6">
                                    Hemos enviado un enlace de recuperación a <strong>{forgotEmail}</strong>. Revisa tu bandeja de entrada.
                                </p>
                                <button
                                    onClick={() => { setShowForgotModal(false); setForgotSuccess(false); setForgotEmail(''); }}
                                    className="btn-primary w-full"
                                >
                                    Entendido, volver al login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
