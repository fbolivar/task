'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, Loader2,
    Calendar, FileText, Activity, ShieldAlert,
    Database, RotateCcw, CheckCircle
} from 'lucide-react';
import { useToast } from '@/shared/components/Toast';
import {
    ChangeRequest, ChangeRequestFormData, ChangeStatus,
} from '../types';
import { Badge } from '@/shared/components/ui/Badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ChangeFormGeneral } from './ChangeFormGeneral';
import { ChangeFormMatrixComm } from './ChangeFormMatrixComm';
import { ChangeFormPlanning } from './ChangeFormPlanning';
import { ChangeFormRisks } from './ChangeFormRisks';
import { ChangeFormAssets } from './ChangeFormAssets';
import { ChangeFormRollback } from './ChangeFormRollback';

interface ChangeRequestFormProps {
    initialData?: ChangeRequest;
    projects: { id: string; name: string }[];
    assets: { id: string; name: string }[];
    users: { id: string; full_name: string }[];
    onSave: (data: ChangeRequestFormData) => Promise<void>;
    onStatusChange?: (id: string, status: ChangeStatus) => Promise<void>;
    onClose: () => void;
}

const TABS = [
    { id: 'general', label: 'General', icon: FileText },
    { id: 'matrix', label: 'Matriz / Evaluación', icon: Activity },
    { id: 'planning', label: 'Planificación', icon: Calendar },
    { id: 'risks', label: 'Riesgos', icon: ShieldAlert },
    { id: 'assets', label: 'Activos', icon: Database },
    { id: 'rollback', label: 'Rollback', icon: RotateCcw },
];

const EMPTY_FORM: ChangeRequestFormData = {
    project_id: '',
    title: '',
    description: '',
    justification: '',
    priority: 'medium',
    change_type: undefined,
    scope: '',
    start_at: '',
    end_at: '',
    matrix_impact: 'minor',
    matrix_urgency: 'low',
    matrix_prioritization: 'low',
    comm_message: '',
    comm_date: '',
    comm_responsible: 'technology',
    plans: [],
    risks: [],
    rollbacks: [],
    asset_ids: [],
    approver_id: '',
};

export function ChangeRequestForm({ initialData, projects, assets, users, onSave, onStatusChange, onClose }: ChangeRequestFormProps) {
    const { toast } = useToast();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<ChangeRequestFormData>(EMPTY_FORM);

    const currentUserId = profile?.id;
    const isApprover = initialData?.approver_id === currentUserId;
    const isRequester = initialData?.requester_id === currentUserId || !initialData;
    const isAdmin = profile?.role?.name === 'Admin';
    const canEdit = isRequester || isAdmin;

    useEffect(() => {
        if (initialData) {
            setFormData({
                project_id: initialData.project_id,
                task_id: initialData.task_id,
                title: initialData.title,
                description: initialData.description,
                justification: initialData.justification,
                priority: initialData.priority,
                change_type: initialData.change_type,
                scope: initialData.scope || '',
                start_at: initialData.start_at ? new Date(initialData.start_at).toISOString().slice(0, 16) : '',
                end_at: initialData.end_at ? new Date(initialData.end_at).toISOString().slice(0, 16) : '',
                matrix_impact: initialData.matrix_impact || 'minor',
                matrix_urgency: initialData.matrix_urgency || 'low',
                matrix_prioritization: initialData.matrix_prioritization || 'low',
                comm_message: initialData.comm_message || '',
                comm_date: initialData.comm_date ? new Date(initialData.comm_date).toISOString().slice(0, 16) : '',
                comm_responsible: initialData.comm_responsible || 'technology',
                plans: initialData.plans || [],
                risks: initialData.risks || [],
                rollbacks: initialData.rollbacks || [],
                asset_ids: initialData.assets?.map(a => a.id) || [],
                approver_id: initialData.approver_id || '',
            });
        } else if (projects.length > 0 && !formData.project_id) {
            setFormData(prev => ({ ...prev, project_id: projects[0].id }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData, projects]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.project_id || !formData.title.trim() || !formData.approver_id) {
            toast('Debes seleccionar un proyecto, ingresar un título y asignar un autorizador', 'warning');
            return;
        }
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-5xl h-[90vh] flex flex-col relative border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex-none p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20 flex items-center justify-center text-white">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground">
                                {initialData ? `Editar Solicitud ${initialData.code}` : 'Nueva Solicitud de Cambio'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-slate-100 dark:bg-slate-800 text-xs font-bold px-2 py-0.5">V2.0 ITIL</Badge>
                                {initialData && <Badge>{initialData.status}</Badge>}
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar formulario" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                    </button>
                </div>

                {/* Body - Flex Layout with Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 flex-none border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-1 overflow-y-auto">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    type="button"
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                                        ${isActive
                                            ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200 dark:border-slate-700'
                                            : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'}
                                    `}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900">
                        <form onSubmit={handleSubmit} id="change-form" className={`max-w-3xl mx-auto pb-20 ${!canEdit ? 'pointer-events-none opacity-80' : ''}`}>
                            {activeTab === 'general' && (
                                <ChangeFormGeneral
                                    formData={formData}
                                    onChange={setFormData}
                                    projects={projects}
                                    users={users}
                                    isEditMode={!!initialData}
                                />
                            )}
                            {activeTab === 'matrix' && (
                                <ChangeFormMatrixComm
                                    formData={formData}
                                    onChange={setFormData}
                                />
                            )}
                            {activeTab === 'planning' && (
                                <ChangeFormPlanning
                                    formData={formData}
                                    onChange={setFormData}
                                    users={users}
                                />
                            )}
                            {activeTab === 'risks' && (
                                <ChangeFormRisks
                                    formData={formData}
                                    onChange={setFormData}
                                    users={users}
                                />
                            )}
                            {activeTab === 'assets' && (
                                <ChangeFormAssets
                                    formData={formData}
                                    onChange={setFormData}
                                    assets={assets}
                                />
                            )}
                            {activeTab === 'rollback' && (
                                <ChangeFormRollback
                                    formData={formData}
                                    onChange={setFormData}
                                />
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-none p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>

                    {initialData?.status === 'submitted' && onStatusChange && isApprover && (
                        <>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!window.confirm('¿Confirmas el RECHAZO de esta solicitud?')) return;
                                    setIsSaving(true);
                                    await onStatusChange(initialData.id, 'rejected');
                                    setIsSaving(false);
                                    onClose();
                                }}
                                disabled={isSaving}
                                className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
                            >
                                Rechazar
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!window.confirm('¿Confirmas la APROBACIÓN de esta solicitud?')) return;
                                    setIsSaving(true);
                                    await onStatusChange(initialData.id, 'approved');
                                    setIsSaving(false);
                                    onClose();
                                }}
                                disabled={isSaving}
                                className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-200 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 mr-2 inline-block" />
                                Aprobar Cambio
                            </button>
                        </>
                    )}

                    {canEdit && (
                        <button
                            type="submit"
                            form="change-form"
                            disabled={isSaving}
                            className="btn-primary px-8 py-2.5 text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Solicitud
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
