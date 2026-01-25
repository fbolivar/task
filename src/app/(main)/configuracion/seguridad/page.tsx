'use client';

import { useState } from 'react';
import { Shield, Lock, Globe, Key, AlertTriangle, Save, RefreshCw } from 'lucide-react';

export default function SecurityPage() {
    const [saving, setSaving] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-black text-foreground">Seguridad del Sistema</h2>
                <p className="text-muted-foreground text-sm font-medium">Configuración de Firewall, Headers y Políticas de Acceso</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* WAF Simulation */}
                <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Web Application Firewall (WAF)</h3>
                            <p className="text-xs text-muted-foreground">Protección activa contra amenazas comunes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ToggleItem
                            title="Protección contra SQL Injection"
                            description="Sanitización automática de inputs en Supabase RPC"
                            active={true}
                        />
                        <ToggleItem
                            title="Rate Limiting"
                            description="Máximo 100 req/min por IP"
                            active={true}
                        />
                        <ToggleItem
                            title="Protección XSS"
                            description="Content-Security-Policy Headers estrictos"
                            active={true}
                        />
                        <ToggleItem
                            title="Geo-Bloqueo"
                            description="Permitir acceso solo desde Colombia (CO)"
                            active={false}
                        />
                    </div>
                </div>

                {/* Headers & Sessions */}
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Sesiones y Autenticación</h3>
                                <p className="text-xs text-muted-foreground">Políticas de expiración y contraseñas</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Expiración de Sesión (Minutos)</label>
                                <input type="number" defaultValue={60} className="input-premium w-full" />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Longitud Mínima de Contraseña</label>
                                <input type="number" defaultValue={8} className="input-premium w-full" />
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
                                <Key className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Forzar cambio de contraseña</p>
                                    <p className="text-xs text-muted-foreground">Cada 90 días</p>
                                </div>
                                <input type="checkbox" className="toggle" defaultChecked />
                            </div>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div className="glass-card p-6 space-y-4 opacity-50 pointer-events-none grayscale">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">API Access (Enterprise)</h3>
                                <p className="text-xs text-muted-foreground">Gestión de llaves para integraciones externas</p>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <p className="text-xs font-bold text-amber-600">Requiere Plan Enterprise</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 pt-4 border-t border-border flex justify-end">
                    <button className="btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Guardar Configuración
                    </button>
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ title, description, active }: { title: string, description: string, active: boolean }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
            <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
        </div>
    );
}
