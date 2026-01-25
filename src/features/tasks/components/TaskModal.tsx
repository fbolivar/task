'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Save,
    CheckSquare,
    AlignLeft,
    Calendar,
    Loader2,
    Briefcase,
    User as UserIcon,
    Flag,
    AlertCircle
} from 'lucide-react';
import { Task, TaskFormData, TaskPriority, TaskStatus, TaskSubStatus } from '../types';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: TaskFormData) => Promise<void>;
    task?: Task | null;
}

const initialFormData: TaskFormData = {
    title: '',
    project_id: null,
    notes: '',
    status: 'Pendiente',
    sub_status: 'En Tiempo',
    priority: 'Media',
    end_date: null,
    assigned_to: null,
    evidence_link: null,
};

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
    const { t } = useSettings();
    const [formData, setFormData] = useState<TaskFormData>(initialFormData);
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string, full_name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // ... (useEffect hooks match but ensure no translation logic here) ...

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                project_id: task.project_id,
                notes: task.notes,
                status: task.status,
                sub_status: task.sub_status,
                priority: task.priority,
                end_date: task.end_date,
                assigned_to: task.assigned_to,
                evidence_link: task.evidence_link || null,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [task]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();
            const [projectsRes, usersRes] = await Promise.all([
                supabase.from('projects').select('id, name'),
                supabase.from('profiles').select('id, full_name')
            ]);
            if (projectsRes.data) setProjects(projectsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            setLoading(false);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving task:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">
                                {task ? t('tasks.edit') : t('tasks.new')}
                            </h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Planificación Operativa</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-primary/10 rounded-xl transition-all">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.title')}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all font-bold text-lg"
                            placeholder="¿Qué se necesita hacer?"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.project')}</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={formData.project_id || ''}
                                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium appearance-none"
                                >
                                    <option value="">{t('general.none')}</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.assignedTo')}</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <select
                                    value={formData.assigned_to || ''}
                                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium appearance-none"
                                >
                                    <option value="">{t('tasks.form.unassigned')}</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('general.priority')}</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                            >
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.status')}</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Revisión">Revisión</option>
                                <option value="Completado">Completado</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.risk')}</label>
                            <select
                                value={formData.sub_status}
                                onChange={(e) => setFormData({ ...formData, sub_status: e.target.value as TaskSubStatus })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                            >
                                <option value="En Tiempo">En Tiempo</option>
                                <option value="En Riesgo">En Riesgo</option>
                                <option value="Demorado">Demorado</option>
                                <option value="Bloqueado">Bloqueado</option>
                            </select>
                        </div>
                    </div>



                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.dueDate')}</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={formData.end_date || ''}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Google Drive (Link)</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="url"
                                    value={formData.evidence_link || ''}
                                    onChange={(e) => setFormData({ ...formData, evidence_link: e.target.value || null })}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.notes')}</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium min-h-[80px]"
                            placeholder="Instrucciones o detalles de la tarea..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-bold flex-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {t('general.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-primary flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {task ? t('general.save') : t('general.create')}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
