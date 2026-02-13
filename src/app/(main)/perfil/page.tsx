'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { MFAEnrollment } from '@/features/auth/components/MFAEnrollment';
import { User, Mail, Shield, Key } from 'lucide-react';

export default function ProfilePage() {
    const { user, profile } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-slate-800">Mi Perfil</h1>
                <p className="text-slate-500 font-medium">Gestiona tu información personal y seguridad.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* User Info Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                        <div className="w-24 h-24 mx-auto bg-[#166A2F]/10 rounded-full flex items-center justify-center text-[#166A2F] text-3xl font-bold mb-4">
                            {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <h2 className="font-bold text-lg text-slate-900">{profile?.full_name || 'Usuario'}</h2>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                        <div className="mt-4 inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                            {profile?.role?.name || 'Usuario'}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#166A2F]" />
                            Detalles de Cuenta
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">ID de Usuario</label>
                                <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 truncate">
                                    {user.id}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Último Acceso</label>
                                <p className="text-sm text-slate-700">
                                    {new Date(user.last_sign_in_at || '').toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                            <Key className="w-5 h-5 text-[#166A2F]" />
                            Seguridad
                        </h3>

                        <div className="space-y-6">
                            <div className="pb-6 border-b border-slate-100">
                                <h4 className="font-semibold text-slate-800 mb-1">Contraseña</h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    Se recomienda cambiar tu contraseña periódicamente.
                                </p>
                                <button className="text-sm font-semibold text-[#166A2F] hover:underline">
                                    Cambiar contraseña &rarr;
                                </button>
                            </div>

                            <MFAEnrollment />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
