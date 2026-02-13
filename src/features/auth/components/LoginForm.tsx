'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, LoginCredentials } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Leaf, Activity, ShieldCheck } from 'lucide-react';

export function LoginForm() {
    // State for MFA
    const [needsMFA, setNeedsMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [mfaError, setMfaError] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);
    const [factorId, setFactorId] = useState('');

    // Destructure new methods
    const { signIn, loading, listFactors, verifyMFA, profile } = useAuth();

    // Router for manual redirect
    const { useRouter } = require('next/navigation');
    const router = useRouter();

    const { t, ...settings } = useSettings();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

            // 1. Attempt Sign In without redirecting
            const { user, profile: userProfile } = await signIn(credentials, { preventRedirect: true });

            if (!user) throw new Error('Error al iniciar sesión');

            // 2. Check for MFA Factors
            const factors = await listFactors();
            const totpFactor = factors?.all?.find((f: any) =>
                (f.factor_type === 'totp' || f.factorType === 'totp') &&
                f.status === 'verified'
            );

            if (totpFactor) {
                // Has MFA -> Show Input
                setNeedsMFA(true);
                setFactorId(totpFactor.id);
            } else {
                // No MFA -> Enforce Setup
                // Redirect to setup page
                router.push('/setup-2fa');
            }
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

    const handleMFASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMfaError('');
        setMfaLoading(true);

        try {
            if (!factorId) throw new Error('Factor ID no encontrado');

            // Verify the TOTP code
            await verifyMFA(factorId, mfaCode);

            // Redirect after successful MFA
            if (profile?.role?.name === 'Gerente') {
                router.push('/analisis');
            } else {
                router.push('/dashboard');
            }

        } catch (err: any) {
            setMfaError(err.message || 'Código inválido');
        } finally {
            setMfaLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError('');

        try {
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

    const brandName = settings.app_name || 'GestorPro';
    const footerText = settings.footer_text || '© 2024 Parques Nacionales Naturales de Colombia';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 selection:bg-[#166A2F] selection:text-white p-4 relative overflow-hidden">
            {/* Background Decorative Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#166A2F]/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none delay-500"></div>

            {/* Main Floating Card */}
            <div className="bg-white w-full max-w-5xl min-h-[600px] rounded-3xl shadow-2xl overflow-hidden flex relative z-10 mx-auto">

                {/* Left Panel - Illustration & Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-[#166A2F] flex-col justify-between p-12">
                    {/* Background Overlay & Effects */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518173946687-a4c88928d999?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#166A2F]/90 via-[#0B4D24]/80 to-[#052e16]/90"></div>

                    {/* Animated Decorative Shapes */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse delay-700"></div>
                    <div className="absolute bottom-[50px] left-[-30px] w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl animate-pulse"></div>

                    {/* Branding Top */}
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg">
                            <Leaf className="w-6 h-6 text-emerald-300" />
                        </div>
                        <span className="text-white/90 font-medium tracking-wide text-sm bg-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                            {t('auth.tagline') || 'Gestión Inteligente'}
                        </span>
                    </div>

                    {/* Central Headline */}
                    <div className="relative z-10 space-y-6">
                        <h1 className="text-4xl font-bold text-white leading-tight font-heading">
                            {t('auth.headline') || 'Conservación'}
                            <span className="block text-emerald-200/90 font-light italic text-3xl mt-2">
                                {t('auth.headlineSub') || '& Tecnología'}
                            </span>
                        </h1>
                        <p className="text-emerald-100/80 leading-relaxed font-light text-sm max-w-xs border-l-2 border-emerald-400/50 pl-4">
                            {t('auth.description') || 'Plataforma avanzada para la gestión sostenible de recursos naturales.'}
                        </p>
                    </div>

                    {/* Bottom Stats/Info */}
                    <div className="relative z-10 flex gap-3">
                        <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-300" />
                            <div>
                                <div className="text-[10px] text-emerald-200 uppercase tracking-wider">Estado</div>
                                <div className="text-white font-bold text-xs">Operativo</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white relative">
                    <div className="w-full max-w-sm mx-auto space-y-8">

                        {!needsMFA ? (
                            <>
                                <div className="space-y-2 text-center lg:text-left">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-heading">Bienvenido</h2>
                                    <p className="text-slate-500 text-sm">Ingresa tus credenciales para acceder al sistema.</p>
                                </div>

                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                        <Activity className="w-5 h-5 text-red-500 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                                                {t('auth.email')}
                                            </label>
                                            <div className="relative group">
                                                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#166A2F]" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 outline-none focus:border-[#166A2F] focus:ring-4 focus:ring-[#166A2F]/5 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                                    placeholder="nombre@ejemplo.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center pl-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    {t('auth.password')}
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowForgotModal(true); setForgotError(''); }}
                                                    className="text-xs font-semibold text-[#166A2F] hover:text-[#0B4D24] hover:underline"
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </button>
                                            </div>
                                            <div className="relative group">
                                                <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#166A2F]" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 outline-none focus:border-[#166A2F] focus:ring-4 focus:ring-[#166A2F]/5 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                                    placeholder="••••••••"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-[#166A2F] hover:bg-[#125a27] text-white rounded-xl font-bold shadow-lg shadow-[#166A2F]/20 hover:shadow-xl hover:shadow-[#166A2F]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>{t('auth.loginBtn')}</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2 text-center lg:text-left">
                                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-heading flex items-center gap-3">
                                        <ShieldCheck className="w-8 h-8 text-[#166A2F]" />
                                        Autenticación 2FA
                                    </h2>
                                    <p className="text-slate-500 text-sm">
                                        Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                                    </p>
                                </div>

                                {mfaError && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3">
                                        <Activity className="w-5 h-5 text-red-500 shrink-0" />
                                        {mfaError}
                                    </div>
                                )}

                                <form onSubmit={handleMFASubmit} className="space-y-6">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 pl-1">
                                            Código de Verificación
                                        </label>
                                        <input
                                            type="text"
                                            value={mfaCode}
                                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 outline-none focus:border-[#166A2F] focus:ring-4 focus:ring-[#166A2F]/5 transition-all font-mono text-2xl text-center tracking-[0.5em] text-slate-800 placeholder:text-slate-300"
                                            placeholder="000000"
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={mfaLoading || mfaCode.length !== 6}
                                        className="w-full py-4 bg-[#166A2F] hover:bg-[#125a27] text-white rounded-xl font-bold shadow-lg shadow-[#166A2F]/20 hover:shadow-xl hover:shadow-[#166A2F]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        {mfaLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Verificar</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNeedsMFA(false)}
                                        className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                                    >
                                        Volver al inicio de sesión
                                    </button>
                                </form>
                            </div>
                        )}

                        <p className="text-center text-xs text-slate-400 font-medium pt-4">
                            {footerText}
                        </p>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}

            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#051a0b]/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
                    <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#166A2F] rounded-full flex items-center justify-center shadow-xl ring-8 ring-white/10">
                            <Mail className="w-10 h-10 text-white" />
                        </div>

                        {!forgotSuccess ? (
                            <div className="mt-8 text-center space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900">Recuperar Acceso</h3>
                                    <p className="text-slate-500 text-sm mt-2 px-4">
                                        Ingresa tu correo institucional y te enviaremos las instrucciones.
                                    </p>
                                </div>

                                {forgotError && (
                                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg font-medium border border-red-100">
                                        {forgotError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotSubmit} className="space-y-5 text-left">
                                    <div className="group relative">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                                            Correo Electrónico
                                        </label>
                                        <div className="relative">
                                            <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-[#166A2F]" />
                                            <input
                                                type="email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3.5 outline-none focus:border-[#166A2F] focus:ring-4 focus:ring-[#166A2F]/5 transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                                placeholder="nombre@ejemplo.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="flex-1 py-3 bg-[#166A2F] hover:bg-[#125a27] text-white rounded-xl font-semibold shadow-lg shadow-[#166A2F]/20 hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-70 disabled:translate-y-0"
                                        >
                                            {forgotLoading ? 'Enviando...' : 'Enviar Link'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="mt-8 text-center">
                                <h3 className="text-xl font-bold text-slate-900">¡Revisa tu correo!</h3>
                                <p className="text-slate-500 text-sm mt-3 mb-8">
                                    Hemos enviado un enlace de recuperación a <br />
                                    <span className="font-semibold text-[#166A2F]">{forgotEmail}</span>
                                </p>
                                <button
                                    onClick={() => { setShowForgotModal(false); setForgotSuccess(false); setForgotEmail(''); }}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                                >
                                    Volver al Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
