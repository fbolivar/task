'use client';

import { useState, useRef, useEffect } from 'react';
import { LogOut, User, Key, Check, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function UserMenu() {
    const { user, profile, signOut, updatePassword, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email || 'Usuario';
    const roleName = profile?.role?.name || 'Sin rol';
    const userEmail = user?.email || '';

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess(false);

        if (newPassword.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden');
            return;
        }

        try {
            setIsUpdating(true);
            await updatePassword(newPassword);
            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess(false);
            }, 2000);
        } catch (error: any) {
            setPasswordError(error.message || 'Error al actualizar la contraseña');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            {/* Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
            >
                <div className="flex flex-col items-end text-right hidden sm:flex">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {roleName}
                    </span>
                </div>

                <div className="relative">
                    {profile?.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-9 h-9 rounded-full ring-2 ring-transparent group-hover:ring-primary/30 transition-all shadow-sm"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm group-hover:shadow-primary/20 transition-all">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-72 glass-card overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
                    {/* User Info Header */}
                    <div className="p-5 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-950/50 border-b border-slate-200/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-foreground truncate">{displayName}</span>
                                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                            </div>
                        </div>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {roleName}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setShowPasswordModal(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                <Key className="w-4 h-4 text-blue-500" />
                            </div>
                            Cambiar Contraseña
                        </button>
                    </div>

                    <div className="p-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                                <LogOut className="w-4 h-4 text-red-500" />
                            </div>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="glass-card w-full max-w-md overflow-hidden relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-1">Seguridad de la Cuenta</h3>
                            <p className="text-sm text-muted-foreground mb-6">Actualiza tu contraseña para mantener tu cuenta segura.</p>

                            <form onSubmit={handleUpdatePassword} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground ml-1">Nueva Contraseña</label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground ml-1">Confirmar Contraseña</label>
                                    <div className="relative group">
                                        <Check className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Repite tu contraseña"
                                            required
                                        />
                                    </div>
                                </div>

                                {passwordError && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-shake">
                                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                        <p className="text-xs text-red-500 font-medium">{passwordError}</p>
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <p className="text-xs text-emerald-500 font-medium">Contraseña actualizada con éxito</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="btn-secondary flex-1 py-2.5 border border-slate-200 dark:border-slate-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUpdating}
                                        className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Actualizando...
                                            </>
                                        ) : (
                                            'Guardar Cambios'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
