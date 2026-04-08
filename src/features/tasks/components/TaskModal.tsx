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
    AlertCircle,
    HardDrive,
    Clock,
    Repeat
} from 'lucide-react';
import { Task, TaskFormData, TaskPriority, TaskStatus, TaskSubStatus } from '../types';
import { useToast } from '@/shared/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TrackingSection } from './TrackingSection';
import { CommentsSection } from './CommentsSection';
import { DependenciesSection } from './DependenciesSection';
import { SubtasksSection } from './SubtasksSection';
import { ScheduleMeeting } from '@/shared/components/ScheduleMeeting';

interface HoursProgressBarProps {
    actual: number;
    estimated: number;
}

/** Maps a clamped 0-100 percentage to the nearest 10-step CSS class defined in globals.css. */
function toBarWidthClass(pct: number): string {
    const step = Math.round(Math.min(pct, 100) / 10) * 10 as
        0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;
    return `hours-bar-${step}`;
}

function HoursProgressBar({ actual, estimated }: HoursProgressBarProps) {
    const rawPct = (actual / estimated) * 100;
    const over = actual > estimated;
    const warn = rawPct >= 80;
    const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500';
    const textColor = over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-500';
    const widthClass = toBarWidthClass(rawPct);

    return (
        <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Progreso de horas</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>
                    {actual}h / {estimated}h ({Math.round(rawPct)}%)
                </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor} ${widthClass}`} />
            </div>
        </div>
    );
}

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
    estimated_hours: 0,
    actual_hours: 0,
    is_recurring: false,
    recurrence_pattern: null,
    recurrence_end_date: null,
};

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
    const { toast } = useToast();
    const { t } = useSettings();
    const activeEntityId = useAuthStore(state => state.activeEntityId);
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
                estimated_hours: task.estimated_hours ?? 0,
                actual_hours: task.actual_hours ?? 0,
                is_recurring: task.is_recurring || false,
                recurrence_pattern: task.recurrence_pattern ?? null,
                recurrence_end_date: task.recurrence_end_date ?? null,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [task]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();

            // Filter projects by active entity
            let projectsQuery = supabase.from('projects').select('id, name');
            if (activeEntityId && activeEntityId !== 'all') {
                projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
            }

            // Build filtered user list by entity membership
            let userIds: string[] = [];
            if (activeEntityId && activeEntityId !== 'all') {
                const { data: pe } = await supabase
                    .from('profile_entities')
                    .select('profile_id')
                    .eq('entity_id', activeEntityId);
                userIds = (pe || []).map((p: { profile_id: string }) => p.profile_id);

                const { data: globalUsers } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('has_all_entities_access', true)
                    .eq('is_active', true);
                const globalIds = (globalUsers || []).map((u: { id: string }) => u.id);
                userIds = [...new Set([...userIds, ...globalIds])];
            }

            let usersQuery = supabase.from('profiles').select('id, full_name').eq('is_active', true);
            if (userIds.length > 0 && activeEntityId && activeEntityId !== 'all') {
                usersQuery = usersQuery.in('id', userIds);
            }

            const [projectsRes, usersRes] = await Promise.all([projectsQuery, usersQuery]);

            if (projectsRes.data) setProjects(projectsRes.data);
            if (usersRes.data) setUsers(usersRes.data);
            setLoading(false);
        };
        if (isOpen) fetchData();
    }, [isOpen, activeEntityId]);

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
                            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">{t('tasks.form.evidence') || 'Evidencia (Link)'}</label>
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

                    {/* Recurrence Toggle */}
                    <div className="space-y-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_recurring || false}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        is_recurring: e.target.checked,
                                        recurrence_pattern: e.target.checked ? (formData.recurrence_pattern ?? 'weekly') : null,
                                        recurrence_end_date: e.target.checked ? formData.recurrence_end_date : null,
                                    })}
                                    className="peer sr-only"
                                />
                                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-indigo-500 transition-all duration-300" />
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm" />
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <Repeat className="w-4 h-4 text-indigo-500" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-foreground group-hover:text-indigo-600 transition-colors">Tarea Recurrente</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Programa la repetición automática de esta tarea</span>
                                </div>
                            </div>
                        </label>

                        {formData.is_recurring && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-indigo-500/10">
                                <div className="space-y-1.5">
                                    <label htmlFor="recurrence-pattern" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Frecuencia</label>
                                    <select
                                        id="recurrence-pattern"
                                        title="Frecuencia de recurrencia"
                                        value={formData.recurrence_pattern ?? 'weekly'}
                                        onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value as 'daily' | 'weekly' | 'biweekly' | 'monthly' })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                    >
                                        <option value="daily">Diario</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="biweekly">Quincenal</option>
                                        <option value="monthly">Mensual</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="recurrence-end-date" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Fecha Fin de Recurrencia</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            id="recurrence-end-date"
                                            type="date"
                                            title="Fecha fin de recurrencia"
                                            value={formData.recurrence_end_date || ''}
                                            onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value || null })}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hours tracking */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Horas Estimadas</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={formData.estimated_hours ?? 0}
                                        onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Horas Reales</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={formData.actual_hours ?? 0}
                                        onChange={(e) => setFormData({ ...formData, actual_hours: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all text-sm font-medium"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Progress bar — only when editing an existing task and estimated_hours > 0 */}
                        {task && (formData.estimated_hours ?? 0) > 0 && (() => {
                            const pct = Math.min(((formData.actual_hours ?? 0) / (formData.estimated_hours ?? 1)) * 100, 100);
                            const over = (formData.actual_hours ?? 0) > (formData.estimated_hours ?? 0);
                            const warn = (formData.actual_hours ?? 0) / (formData.estimated_hours ?? 1) >= 0.8;
                            const barColor = over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500';
                            const textColor = over ? 'text-red-500' : warn ? 'text-amber-500' : 'text-emerald-500';
                            const rawPct = ((formData.actual_hours ?? 0) / (formData.estimated_hours ?? 1)) * 100;
                            return (
                                <div className="space-y-1.5 px-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Progreso de horas</span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${textColor}`}>
                                            {formData.actual_hours ?? 0}h / {formData.estimated_hours ?? 0}h ({Math.round(rawPct)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
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

                    {/* Subtasks Section - Only on Edit Mode */}
                    {task && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <SubtasksSection taskId={task.id} />
                        </div>
                    )}

                    {/* Tracking Section - Only on Edit Mode */}
                    {task && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <TrackingSection taskId={task.id} />
                        </div>
                    )}

                    {/* Comments Section - Only on Edit Mode */}
                    {task && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <CommentsSection taskId={task.id} />
                        </div>
                    )}

                    {/* Dependencies Section - Only on Edit Mode */}
                    {task && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <DependenciesSection taskId={task.id} projectId={task.project_id} />
                        </div>
                    )}

                    {/* Meeting Scheduler - Only on Edit Mode */}
                    {task && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <ScheduleMeeting
                                entityType="task"
                                entityId={task.id}
                                entityTitle={task.title}
                            />
                        </div>
                    )}

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
