'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    FileText,
    Briefcase,
    User,
    DollarSign,
    Loader2,
    Calendar,
    Target
} from 'lucide-react';
import { HiringProcess, HiringProcessFormData, HiringStatus } from '../types';
import { PhaseTracker } from './PhaseTracker';
import { createClient } from '@/lib/supabase/client';

interface HiringModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: HiringProcessFormData) => Promise<void>;
    onUpdatePhase?: (processId: string, code: string, completed: boolean) => Promise<void>;
    process?: HiringProcess | null;
    entityId: string;
    readOnly?: boolean;
}

const initialFormData: HiringProcessFormData = {
    entity_id: '',
    project_id: null,
    title: '',
    description: '',
    assigned_to: null,
    estimated_amount: 0,
    status: 'En Proceso'
};

export function HiringModal({ isOpen, onClose, onSave, onUpdatePhase, process, entityId, readOnly = false }: HiringModalProps) {
    const [formData, setFormData] = useState<HiringProcessFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [projects, setProjects] = useState<{ id: string, name: string, entity_id: string }[]>([]);
    const [users, setUsers] = useState<{ id: string, full_name: string }[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (process) {
            setFormData({
                entity_id: process.entity_id,
                project_id: process.project_id,
                title: process.title,
                description: process.description || '',
                assigned_to: process.assigned_to,
                estimated_amount: process.estimated_amount,
                status: process.status
            });
        } else {
            setFormData({ ...initialFormData, entity_id: entityId });
        }
    }, [process, isOpen, entityId]);


    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            const supabase = createClient();

            // Fix: Handle 'all' entity case
            let projectsQuery = supabase.from('projects').select('id, name, entity_id');
            if (entityId && entityId !== 'all') {
                projectsQuery = projectsQuery.eq('entity_id', entityId);
            }

            const [projectsRes, usersRes] = await Promise.all([
                projectsQuery,
                supabase.from('profiles').select('id, full_name').eq('is_active', true)
            ]);

            if (projectsRes.data) setProjects(projectsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            setLoadingData(false);
        };
        if (isOpen) fetchData();
    }, [isOpen, entityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving hiring process:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Executive Header */}
                <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative">
                    <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                            <Target className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">
                                {process ? (readOnly ? 'Detalles del Proceso' : 'Actualizar Proceso de Contratación') : 'Registrar Nueva Solicitud de Contratación'}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-emerald-500/30">
                                    Protocolo C-19
                                </span>
                                {process && (
                                    <span className="bg-primary/20 text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-primary/30">
                                        Avance: {process.total_progress}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white dark:bg-slate-900">
                    {/* Left: Core Data */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Descripción del Proceso</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-lg"
                                placeholder="Ej: Adquisición de Licencias de Software 2026"
                                disabled={readOnly}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Proyecto Vinculado</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <select
                                        value={formData.project_id || ''}
                                        onChange={(e) => {
                                            const newProjectId = e.target.value || null;
                                            const selectedProject = projects.find(p => p.id === newProjectId);
                                            setFormData({
                                                ...formData,
                                                project_id: newProjectId,
                                                entity_id: selectedProject?.entity_id || (entityId !== 'all' ? entityId : formData.entity_id)
                                            });
                                        }}
                                        disabled={readOnly}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-xs font-bold appearance-none disabled:opacity-60"
                                    >
                                        <option value="">Ninguno</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Responsable</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <select
                                        value={formData.assigned_to || ''}
                                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                                        disabled={readOnly}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-xs font-bold appearance-none disabled:opacity-60"
                                    >
                                        <option value="">Sin Asignar</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Presupuesto Estimado</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        value={formData.estimated_amount}
                                        onChange={(e) => setFormData({ ...formData, estimated_amount: parseFloat(e.target.value) || 0 })}
                                        disabled={readOnly}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-xs font-bold disabled:opacity-60"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado General</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as HiringStatus })}
                                    disabled={readOnly}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-xs font-bold appearance-none disabled:opacity-60"
                                >
                                    <option value="En Proceso">En Proceso</option>
                                    <option value="Adjudicado">Adjudicado</option>
                                    <option value="Legalizado">Legalizado</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observaciones Técnicas</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                disabled={readOnly}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-xs font-bold min-h-[100px] disabled:opacity-60"
                                placeholder="Detalles relevantes para la contratación..."
                            />
                        </div>
                    </div>

                    {/* Right: Phase Tracking */}
                    <div className="space-y-6">
                        {process ? (
                            <PhaseTracker
                                phases={process.phases || []}
                                onTogglePhase={async (code, completed) => {
                                    if (onUpdatePhase) {
                                        await onUpdatePhase(process.id, code, completed);
                                    }
                                }}
                                readOnly={readOnly}
                            />
                        ) : (
                            <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-60">
                                <Target className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="text-xs font-black uppercase text-slate-400">El seguimiento de fases se activará tras el registro inicial.</p>
                            </div>
                        )}

                        <div className="mt-auto flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {readOnly ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {!readOnly && (
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {process ? 'Actualizar Ficha' : 'Iniciar Proceso'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
