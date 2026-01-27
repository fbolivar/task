'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Lock, Globe, Key, AlertTriangle, Save, Loader2, Plus, Trash2, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface SecuritySettings {
    id: string;
    sql_injection_protection: boolean;
    rate_limiting: boolean;
    rate_limit_requests: number;
    xss_protection: boolean;
    geo_blocking: boolean;
    allowed_countries: string[];
    session_expiry_minutes: number;
    min_password_length: number;
    force_password_change: boolean;
    password_change_days: number;
}

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    permissions: string[];
    rate_limit: number;
    is_active: boolean;
    last_used_at: string | null;
    created_at: string;
}

const defaultSettings: SecuritySettings = {
    id: '00000000-0000-0000-0000-000000000001',
    sql_injection_protection: true,
    rate_limiting: true,
    rate_limit_requests: 100,
    xss_protection: true,
    geo_blocking: false,
    allowed_countries: ['CO'],
    session_expiry_minutes: 60,
    min_password_length: 8,
    force_password_change: true,
    password_change_days: 90
};

export default function SecurityPage() {
    const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // New key modal state
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [creatingKey, setCreatingKey] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Fetch security settings
        const { data: settingsData } = await supabase
            .from('security_settings')
            .select('*')
            .single();

        if (settingsData) {
            setSettings(settingsData);
        }

        // Fetch API keys
        const { data: keysData } = await supabase
            .from('api_keys')
            .select('*')
            .order('created_at', { ascending: false });

        if (keysData) {
            setApiKeys(keysData);
        }

        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        const { error } = await supabase
            .from('security_settings')
            .update({
                sql_injection_protection: settings.sql_injection_protection,
                rate_limiting: settings.rate_limiting,
                rate_limit_requests: settings.rate_limit_requests,
                xss_protection: settings.xss_protection,
                geo_blocking: settings.geo_blocking,
                allowed_countries: settings.allowed_countries,
                session_expiry_minutes: settings.session_expiry_minutes,
                min_password_length: settings.min_password_length,
                force_password_change: settings.force_password_change,
                password_change_days: settings.password_change_days,
                updated_at: new Date().toISOString()
            })
            .eq('id', settings.id);

        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } else {
            console.error('Error saving settings:', error);
            alert('Error guardando configuración');
        }
        setSaving(false);
    };

    const toggleSetting = (key: keyof SecuritySettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Generate a secure random API key
    const generateSecureKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'sgp_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    };

    // Simple hash function for demo (in production, use crypto.subtle or server-side)
    const simpleHash = async (str: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) return;
        setCreatingKey(true);

        const rawKey = generateSecureKey();
        const keyHash = await simpleHash(rawKey);
        const keyPrefix = rawKey.substring(0, 8);

        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase
            .from('api_keys')
            .insert({
                name: newKeyName,
                key_hash: keyHash,
                key_prefix: keyPrefix,
                permissions: newKeyPermissions,
                created_by: user?.id
            });

        if (!error) {
            setGeneratedKey(rawKey);
            fetchData(); // Refresh list
        } else {
            console.error('Error creating key:', error);
            alert('Error creando llave');
        }
        setCreatingKey(false);
    };

    const handleDeleteKey = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta llave API?')) return;

        await supabase.from('api_keys').delete().eq('id', id);
        setApiKeys(prev => prev.filter(k => k.id !== id));
    };

    const handleToggleKeyActive = async (id: string, currentState: boolean) => {
        await supabase.from('api_keys').update({ is_active: !currentState }).eq('id', id);
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentState } : k));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

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
                            active={settings.sql_injection_protection}
                            onToggle={() => toggleSetting('sql_injection_protection')}
                        />
                        <ToggleItem
                            title="Rate Limiting"
                            description={`Máximo ${settings.rate_limit_requests} req/min por IP`}
                            active={settings.rate_limiting}
                            onToggle={() => toggleSetting('rate_limiting')}
                        />
                        <ToggleItem
                            title="Protección XSS"
                            description="Content-Security-Policy Headers estrictos"
                            active={settings.xss_protection}
                            onToggle={() => toggleSetting('xss_protection')}
                        />
                        <ToggleItem
                            title="Permissions Policy"
                            description="Bloqueo de Hardware (Cámara, Micrófono, USB)"
                            active={true}
                            onToggle={() => { }} // Enforced by Middleware
                        />
                        <ToggleItem
                            title="Geo-Bloqueo"
                            description="Permitir acceso solo desde Colombia (CO)"
                            active={settings.geo_blocking}
                            onToggle={() => toggleSetting('geo_blocking')}
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
                                <input
                                    type="number"
                                    value={settings.session_expiry_minutes}
                                    onChange={(e) => setSettings({ ...settings, session_expiry_minutes: Number(e.target.value) })}
                                    className="input-premium w-full"
                                    min={5}
                                    max={1440}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Longitud Mínima de Contraseña</label>
                                <input
                                    type="number"
                                    value={settings.min_password_length}
                                    onChange={(e) => setSettings({ ...settings, min_password_length: Number(e.target.value) })}
                                    className="input-premium w-full"
                                    min={6}
                                    max={32}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
                                <Key className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Forzar cambio de contraseña</p>
                                    <p className="text-xs text-muted-foreground">Cada {settings.password_change_days} días</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleSetting('force_password_change')}
                                    className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.force_password_change ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${settings.force_password_change ? 'translate-x-4' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Keys - Now Active! */}
                <div className="lg:col-span-2 glass-card p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">API Access (Enterprise)</h3>
                                <p className="text-xs text-muted-foreground">Gestión de llaves para integraciones externas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowNewKeyModal(true); setGeneratedKey(null); setNewKeyName(''); }}
                            className="btn-primary text-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Llave
                        </button>
                    </div>

                    {/* API Keys List */}
                    <div className="space-y-3">
                        {apiKeys.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No hay llaves API configuradas</p>
                                <p className="text-xs">Crea una llave para integrar sistemas externos</p>
                            </div>
                        )}
                        {apiKeys.map(key => (
                            <div
                                key={key.id}
                                className={`flex items-center justify-between p-4 rounded-xl border ${key.is_active
                                    ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                    : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 opacity-60'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                    <div>
                                        <p className="font-bold text-sm">{key.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}••••••••</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-primary/10 text-primary">
                                        {key.permissions.join(', ')}
                                    </span>
                                    <button
                                        onClick={() => handleToggleKeyActive(key.id, key.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${key.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title={key.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {key.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteKey(key.id)}
                                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 pt-4 border-t border-border flex justify-end gap-3">
                    {saved && (
                        <span className="text-sm text-emerald-600 font-bold flex items-center gap-1">
                            ✓ Guardado
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar Configuración
                    </button>
                </div>
            </div>

            {/* New Key Modal */}
            {showNewKeyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md p-6 space-y-6 m-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">Nueva Llave API</h3>
                            <button onClick={() => setShowNewKeyModal(false)} className="text-muted-foreground hover:text-foreground">
                                ✕
                            </button>
                        </div>

                        {!generatedKey ? (
                            <>
                                <div>
                                    <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Nombre / Descripción</label>
                                    <input
                                        type="text"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                        className="input-premium w-full"
                                        placeholder="Ej: Power BI Integration"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Permisos</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['read', 'write', 'delete'].map(perm => (
                                            <button
                                                key={perm}
                                                type="button"
                                                onClick={() => {
                                                    setNewKeyPermissions(prev =>
                                                        prev.includes(perm)
                                                            ? prev.filter(p => p !== perm)
                                                            : [...prev, perm]
                                                    );
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${newKeyPermissions.includes(perm)
                                                    ? 'bg-primary text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                                                    }`}
                                            >
                                                {perm.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateKey}
                                    disabled={creatingKey || !newKeyName.trim()}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                    Generar Llave
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        <p className="font-bold text-emerald-600">¡Llave Generada!</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Copia esta llave ahora. <strong>No podrás verla de nuevo.</strong>
                                    </p>
                                    <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg font-mono text-emerald-400 text-sm break-all">
                                        {generatedKey}
                                        <button
                                            onClick={() => copyToClipboard(generatedKey)}
                                            className="ml-auto flex-shrink-0 p-1.5 hover:bg-slate-800 rounded transition-colors"
                                            title="Copiar"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowNewKeyModal(false)}
                                    className="btn-secondary w-full"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ToggleItem({ title, description, active, onToggle }: { title: string, description: string, active: boolean, onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
            <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <button
                type="button"
                onClick={onToggle}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}
