'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { MFAEnrollment } from '@/features/auth/components/MFAEnrollment';
import { User, Mail, Shield, Key, X, Eye, EyeOff, CheckCircle, AlertCircle, Lock, Check } from 'lucide-react';
import { validatePassword } from '@/shared/utils/passwordValidation';
import { NotificationPreferences } from '@/features/notifications/components/NotificationPreferences';

export default function ProfilePage() {
    const { user, profile, updatePassword } = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-foreground">Mi Perfil</h1>
                <p className="text-muted-foreground font-medium">Gestiona tu información personal y seguridad.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                        <div className="w-24 h-24 mx-auto bg-[#166A2F]/10 rounded-full flex items-center justify-center text-[#166A2F] text-3xl font-bold mb-4">
                            {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <h2 className="font-bold text-lg text-foreground">{profile?.full_name || 'Usuario'}</h2>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-muted-foreground">
                            {profile?.role?.name || 'Usuario'}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="font-bold text-foreground flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#166A2F]" />
                            Detalles de Cuenta
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase">ID de Usuario</label>
                                <p className="text-xs font-mono text-muted-foreground bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 truncate">
                                    {user.id}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase">Último Acceso</label>
                                <p className="text-sm text-foreground">
                                    {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-[#166A2F]" />
                            Seguridad
                        </h3>

                        <div className="space-y-6">
                            <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                                <h4 className="font-semibold text-foreground mb-1">Contraseña</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Se recomienda cambiar tu contraseña periódicamente.
                                </p>
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="text-sm font-semibold text-[#166A2F] hover:underline"
                                >
                                    Cambiar contraseña &rarr;
                                </button>
                            </div>

                            <MFAEnrollment />
                        </div>
                    </div>

                    <NotificationPreferences userId={user.id} />
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <PasswordChangeModal
                    onClose={() => setShowPasswordModal(false)}
                    onSubmit={updatePassword}
                />
            )}
        </div>
    );
}

function PasswordChangeModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (password: string) => Promise<void> }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validation = validatePassword(password);
        if (!validation.valid) {
            setError(validation.errors.join('. '));
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(password);
            setSuccess(true);
            setTimeout(() => onClose(), 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al actualizar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Cambiar Contraseña</h3>
                            <p className="text-xs text-muted-foreground">Actualiza tu contraseña de acceso</p>
                        </div>
                    </div>
                    <button type="button" title="Cerrar" onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {success ? (
                    <div className="p-8 text-center space-y-3">
                        <div className="w-16 h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <p className="font-bold text-foreground">Contraseña actualizada</p>
                        <p className="text-sm text-muted-foreground">Tu contraseña ha sido cambiada exitosamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none text-sm font-medium"
                                        placeholder="Mínimo 8 caracteres"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {password && <PasswordChecks password={password} />}

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar Contraseña</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none text-sm font-medium"
                                    placeholder="Repite la contraseña"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {loading ? (
                                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                {loading ? 'Actualizando...' : 'Actualizar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function PasswordChecks({ password }: { password: string }) {
    const checks = [
        { label: 'Minimo 8 caracteres', met: password.length >= 8 },
        { label: 'Una mayuscula', met: /[A-Z]/.test(password) },
        { label: 'Una minuscula', met: /[a-z]/.test(password) },
        { label: 'Un numero', met: /[0-9]/.test(password) },
    ];
    return (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
            {checks.map((c) => (
                <div key={c.label} className={`flex items-center gap-1.5 text-[10px] font-semibold ${c.met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    <Check className={`w-3 h-3 ${c.met ? 'opacity-100' : 'opacity-30'}`} />
                    {c.label}
                </div>
            ))}
        </div>
    );
}
