'use client';

import { useState, useEffect } from 'react';
import { thresholdService, EntityThresholds } from '@/features/entities/services/thresholdService';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    Settings2,
    BellRing,
    ShieldAlert,
    Save,
    CheckCircle2,
    Info,
    LayoutDashboard
} from 'lucide-react';

import { authService } from '@/features/auth/services/authService';
import { Profile } from '@/features/auth/types';

export function ThresholdSettings() {
    const activeEntityId = useAuthStore(state => state.activeEntityId);
    const [thresholds, setThresholds] = useState<EntityThresholds | null>(null);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [thresholdData, profileData] = await Promise.all([
                    activeEntityId !== 'all' ? thresholdService.getThresholds(activeEntityId) : Promise.resolve(null),
                    authService.getAllProfiles()
                ]);
                setThresholds(thresholdData || {
                    id: '',
                    entity_id: activeEntityId,
                    budget_warning_percent: 80,
                    budget_critical_percent: 95,
                    task_risk_check_enabled: true,
                    auto_reassign_enabled: false,
                    reassign_after_days: 3,
                    backup_assignee_id: null,
                    updated_at: new Date().toISOString()
                });
                setProfiles(profileData);
            } catch (error) {
                console.error('Error loading config:', error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [activeEntityId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        e.preventDefault();
        if (!activeEntityId || activeEntityId === 'all') return;

        // Ensure we have at least partial data from state to save
        if (!thresholds) return;

        try {
            setSaving(true);
            await thresholdService.updateThresholds(activeEntityId, {
                budget_warning_percent: thresholds.budget_warning_percent,
                budget_critical_percent: thresholds.budget_critical_percent,
                task_risk_check_enabled: thresholds.task_risk_check_enabled,
                auto_reassign_enabled: thresholds.auto_reassign_enabled,
                reassign_after_days: thresholds.reassign_after_days,
                backup_assignee_id: thresholds.backup_assignee_id
            });
            setMessage({ type: 'success', text: 'Umbrales actualizados correctamente' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al actualizar umbrales' });
        } finally {
            setSaving(false);
        }
    };

    if (activeEntityId === 'all') {
        return (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center">
                    <LayoutDashboard className="w-8 h-8 text-primary/40" />
                </div>
                <h3 className="text-xl font-black text-foreground">Selección de Entidad Requerida</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Para configurar los umbrales de alerta, primero debes seleccionar una entidad específica en el selector principal.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="glass-card overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <Settings2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Configuración de Umbrales</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Personalización de Alertas del Ecosistema</p>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Budget Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <BellRing className="w-4 h-4 text-amber-500" /> Alerta de Advertencia (Presupuesto)
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-foreground">Porcentaje de Disparo</span>
                                        <span className="text-2xl font-black text-amber-500">{thresholds?.budget_warning_percent}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        value={thresholds?.budget_warning_percent || 80}
                                        onChange={(e) => setThresholds(t => t ? { ...t, budget_warning_percent: parseInt(e.target.value) } : null)}
                                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                        *Se notificará a la gerencia cuando la ejecución fiscal alcance este límite.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Alerta Crítica (Presupuesto)
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-bold text-foreground">Porcentaje de Disparo</span>
                                        <span className="text-2xl font-black text-rose-500">{thresholds?.budget_critical_percent}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        value={thresholds?.budget_critical_percent || 95}
                                        onChange={(e) => setThresholds(t => t ? { ...t, budget_critical_percent: parseInt(e.target.value) } : null)}
                                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                        *Se dispararán protocolos de emergencia y alertas de alto impacto.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Operational Check */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-primary shadow-sm">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-foreground">Monitor de Tareas Críticas</h4>
                                        <p className="text-xs text-muted-foreground">Alertar automáticamente sobre tareas de alta prioridad vencidas.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={thresholds?.task_risk_check_enabled}
                                        onChange={(e) => setThresholds(t => t ? { ...t, task_risk_check_enabled: e.target.checked } : null)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Auto-Reassignment Module */}
                            <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${thresholds?.auto_reassign_enabled ? 'border-primary/20 bg-primary/5' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-colors ${thresholds?.auto_reassign_enabled ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-muted-foreground'}`}>
                                            <Save className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-foreground uppercase tracking-tight">Re-asignación Automatizada</h4>
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Protocolo de Salvaguarda Operativa</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={thresholds?.auto_reassign_enabled}
                                            onChange={(e) => setThresholds(t => t ? { ...t, auto_reassign_enabled: e.target.checked } : null)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                {thresholds?.auto_reassign_enabled && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-500">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Responsable de Respaldo (Backup)</label>
                                            <select
                                                value={thresholds.backup_assignee_id || ''}
                                                onChange={(e) => setThresholds(t => t ? { ...t, backup_assignee_id: e.target.value } : null)}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            >
                                                <option value="">Seleccionar responsable...</option>
                                                {profiles.map(p => (
                                                    <option key={p.id} value={p.id}>{p.full_name} ({p.role?.name})</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                                *Las tareas vencidas se moverán a este usuario automáticamente.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">Periodo de Gracia</label>
                                                <span className="text-lg font-black text-primary">{thresholds.reassign_after_days} días</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="15"
                                                value={thresholds.reassign_after_days}
                                                onChange={(e) => setThresholds(t => t ? { ...t, reassign_after_days: parseInt(e.target.value) } : null)}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                            <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                                *Tiempo de espera tras el vencimiento antes de disparar la re-asignación.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Los cambios afectan a todos los Key Accounts de la entidad.</span>
                            </div>

                            <div className="flex items-center gap-4">
                                {message && (
                                    <span className={`text-xs font-bold flex items-center gap-1.5 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <CheckCircle2 className="w-4 h-4" /> {message.text}
                                    </span>
                                )}
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
