'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, LoginCredentials } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export function LoginForm() {
    const { signIn, loading } = useAuth();
    const { t, ...settings } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">{t('auth.tagline')}</span>
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight">
                        {t('auth.headline')}<br />
                        <span className="text-white/80">{t('auth.headlineSub')}</span>
                    </h2>
                    <p className="text-white/60 text-lg max-w-md leading-relaxed">
                        {t('auth.description')}
                    </p>

                    <div className="flex gap-4 pt-4">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            <p className="text-white/60 text-xs uppercase tracking-widest">{t('auth.projects')}</p>
                            <p className="text-white font-black text-xl">∞</p>
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            <p className="text-white/60 text-xs uppercase tracking-widest">{t('auth.users')}</p>
                            <p className="text-white font-black text-xl">∞</p>
                        </div>
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                            <p className="text-white/60 text-xs uppercase tracking-widest">{t('auth.security')}</p>
                            <p className="text-white font-black text-xl">100%</p>
                        </div>
                    </div>
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
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                                {settings.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-black" style={{ color: settings.header_color }}>{settings.app_name.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">{settings.app_name}</h2>
                                <p className="text-muted-foreground text-sm font-medium">{t('auth.enterCredentials')}</p>
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
                                <label htmlFor="email" className="block text-sm font-bold text-foreground">
                                    {t('auth.email')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder={t('auth.emailPlaceholder')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-bold text-foreground">
                                    {t('auth.password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                        placeholder={t('auth.passwordPlaceholder')}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
                                style={{
                                    backgroundColor: settings.header_color,
                                    boxShadow: `0 10px 40px ${settings.header_color}40`
                                }}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('auth.loggingIn')}
                                    </>
                                ) : (
                                    <>
                                        {t('auth.loginBtn')}
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
