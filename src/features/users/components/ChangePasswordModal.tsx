'use client';

import { useState } from 'react';
import { UserProfile } from '../types';
import { X, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => Promise<void>;
    user: UserProfile | null;
}

export function ChangePasswordModal({ isOpen, onClose, onConfirm, user }: Props) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            setLoading(true);
            await onConfirm(password);
            setPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al actualizar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Cambiar Contraseña</h3>
                            <p className="text-xs text-muted-foreground">Admin Override</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-900/20">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                            Estás cambiando la contraseña para <strong>{user.full_name || user.email}</strong>.
                            El usuario deberá usar esta nueva credencial en su próximo inicio de sesión.
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500/50 transition-all outline-none text-sm font-medium"
                                    placeholder="Mínimo 6 caracteres"
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

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirmar Contraseña</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500/50 transition-all outline-none text-sm font-medium"
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
                            className="flex-1 py-3 items-center justify-center font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
            </div>
        </div>
    );
}
