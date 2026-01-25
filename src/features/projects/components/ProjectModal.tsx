'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Save,
    Briefcase,
    AlignLeft,
    Calendar,
    BarChart,
    ShieldCheck,
    DollarSign,
    Loader2,
    Building2,
    Flag
} from 'lucide-react';
import { Project, ProjectFormData, ProjectPriority, ProjectStatus, Entity } from '../types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ProjectFormData) => Promise<void>;
    project?: Project | null;
}

const initialFormData: ProjectFormData = {
    name: '',
    entity_id: null,
    description: '',
    status: 'Activo',
    priority: 'Media',
    start_date: null,
    end_date: null,
    contract_active: true,
    has_support: false,
    budget: 0,
};

export function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
    const { t } = useSettings();
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    // ... (useEffect hooks match but ensure no translation logic here) ...

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name,
                entity_id: project.entity_id,
                description: project.description,
                status: project.status,
                priority: project.priority,
                start_date: project.start_date,
                end_date: project.end_date,
                contract_active: project.contract_active,
                has_support: project.has_support,
                budget: project.budget || 0,
            });
        } else {
            setFormData({
                ...initialFormData,
                entity_id: activeEntityId || null
            });
        }
    }, [project, activeEntityId, isOpen]);

    useEffect(() => {
        const fetchEntities = async () => {
            setLoading(true);
            const supabase = createClient();

            // Get current user profile to check permissions
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('has_all_entities_access')
                .eq('id', user.id)
                .single();

            if (profile?.has_all_entities_access) {
                // Admin sees all
                const { data } = await supabase.from('entities').select('id, name');
                if (data) setEntities(data);
            } else {
                // Regular user sees only assigned entities
                const { data: profileEntities } = await supabase
                    .from('profile_entities')
                    .select('entity:entities(id, name)')
                    .eq('profile_id', user.id);

                if (profileEntities) {
                    const mappedEntities = profileEntities
                        .map((pe: any) => pe.entity)
                        .filter(Boolean);
                    setEntities(mappedEntities);
                }
            }
            setLoading(false);
        };
        if (isOpen) fetchEntities();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground">
                                {project ? t('projects.edit') : t('projects.new')}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Definición de Portafolio</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-bold text-foreground">{t('projects.form.name')}</label>
                            <div className="relative group">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    placeholder="Ej: Transformación Digital 2024"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">{t('projects.form.entity')}</label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={formData.entity_id || ''}
                                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none"
                                >
                                    <option value="">{t('general.none')}</option>
                                    {entities.map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-foreground">{t('general.budget')}</label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="number"
                                value={formData.budget || ''}
                                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">{t('general.startDate')}</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
                                <input
                                    type="date"
                                    value={formData.start_date || ''}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">{t('general.endDate')}</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors" />
                                <input
                                    type="date"
                                    value={formData.end_date || ''}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-foreground">{t('general.description')}</label>
                        <div className="relative group">
                            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium min-h-[100px]"
                                placeholder="Describe los objetivos y alcance..."
                            />
                        </div>
                    </div>

                    {/* Extras */}
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 min-w-[200px]">
                            <input
                                type="checkbox"
                                checked={formData.contract_active}
                                onChange={(e) => setFormData({ ...formData, contract_active: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{t('projects.form.contract')}</span>
                                <span className="text-[10px] text-muted-foreground">Vigencia legal vigente</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-1 min-w-[200px]">
                            <input
                                type="checkbox"
                                checked={formData.has_support}
                                onChange={(e) => setFormData({ ...formData, has_support: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold">{t('projects.form.support')}</span>
                                <span className="text-[10px] text-muted-foreground">Mantenimiento recurrente</span>
                            </div>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2"
                        >
                            {t('general.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {t('general.loading')}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {project ? t('general.save') : t('general.create')}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
