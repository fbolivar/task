'use client';

import { useState, useEffect } from 'react';
import {
    X, Save, Loader2, AlertTriangle, CheckCircle,
    Calendar, FileText, Activity, ShieldAlert,
    Database, RotateCcw, Send, Archive
} from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import {
    ChangeRequest, ChangeRequestFormData, ChangeType, ChangePriority,
    RiskLevel, ImpactLevel, CommResponsible, ChangePlan, ChangeRisk,
    ChangeRollback, ChangeFollowup
} from '../types';
import { Badge } from '@/shared/components/ui/Badge';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ChangeRequestFormProps {
    initialData?: ChangeRequest;
    projects: { id: string; name: string }[];
    assets: { id: string; name: string }[];
    users: { id: string; full_name: string }[];
    onSave: (data: ChangeRequestFormData) => Promise<void>;
    onStatusChange?: (id: string, status: any) => Promise<void>;
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

// Helper Components (Defined outside to avoid focus loss on re-render)
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
        {children}
    </h3>
);

const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
        {children}
    </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
    />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select
            {...props}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    </div>
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium min-h-[100px]"
    />
);

export function ChangeRequestForm({ initialData, projects, assets, users, onSave, onStatusChange, onClose }: ChangeRequestFormProps) {
    const { t } = useSettings();
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    const currentUserId = profile?.id;
    const isApprover = initialData?.approver_id === currentUserId;
    const isRequester = initialData?.requester_id === currentUserId || !initialData;
    const isAdmin = profile?.role?.name === 'Admin';
    const canEdit = isRequester || isAdmin;

    // Form State
    const [formData, setFormData] = useState<ChangeRequestFormData>({
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
        approver_id: ''
    });

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
                approver_id: initialData.approver_id || ''
            });
        } else if (projects.length > 0 && !formData.project_id) {
            setFormData(prev => ({ ...prev, project_id: projects[0].id }));
        }
    }, [initialData, projects, formData.project_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.project_id || !formData.title.trim() || !formData.approver_id) {
            alert('Debes seleccionar un proyecto, ingresar un título y asignar un autorizador');
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

    // Tab Content Renderers
    const renderGeneral = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Label>{t('tasks.form.project')}</Label>
                    <Select
                        value={formData.project_id}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, project_id: e.target.value })}
                        disabled={!!initialData}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Autorizador (Quien aprueba)</Label>
                    <Select
                        value={formData.approver_id || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, approver_id: e.target.value })}
                    >
                        <option value="">Seleccionar...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Tipo de Cambio</Label>
                    <Select
                        value={formData.change_type || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, change_type: e.target.value as ChangeType })}
                    >
                        <option value="">Seleccionar...</option>
                        <option value="telecom">Telecomunicaciones</option>
                        <option value="telephony">Telefonía</option>
                        <option value="security">Seguridad</option>
                        <option value="database">Base de Datos</option>
                        <option value="apps">Aplicaciones</option>
                        <option value="infra">Infraestructura</option>
                    </Select>
                </div>
            </div>

            <div>
                <Label>Título del Cambio</Label>
                <Input
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Resumen corto del cambio"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Label>Fecha Inicio</Label>
                    <Input
                        type="datetime-local"
                        value={formData.start_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, start_at: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Fecha Fin</Label>
                    <Input
                        type="datetime-local"
                        value={formData.end_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, end_at: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <Label>Alcance</Label>
                <Textarea
                    value={formData.scope}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, scope: e.target.value })}
                    placeholder="Descripción detallada del alcance..."
                />
            </div>

            <div>
                <Label>Justificación</Label>
                <Textarea
                    value={formData.justification}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, justification: e.target.value })}
                    placeholder="¿Por qué es necesario este cambio?"
                />
            </div>
        </div>
    );

    const renderMatrix = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionTitle>Evaluación de Impacto y Riesgo</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <Label>Impacto</Label>
                    <Select
                        value={formData.matrix_impact}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, matrix_impact: e.target.value as ImpactLevel })}
                        className="bg-slate-50"
                    >
                        <option value="minor">Menor (Verde)</option>
                        <option value="moderate">Moderado (Amarillo)</option>
                        <option value="major">Mayor (Rojo)</option>
                    </Select>
                </div>
                <div>
                    <Label>Urgencia</Label>
                    <Select
                        value={formData.matrix_urgency}
                        onChange={e => setFormData({ ...formData, matrix_urgency: e.target.value as RiskLevel })}
                    >
                        <option value="low">Baja (Verde)</option>
                        <option value="medium">Media (Amarillo)</option>
                        <option value="high">Alta (Rojo)</option>
                    </Select>
                </div>
                <div>
                    <Label>Priorización</Label>
                    <Select
                        value={formData.matrix_prioritization}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, matrix_prioritization: e.target.value as RiskLevel })}
                    >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                    </Select>
                </div>
            </div>

            <SectionTitle>Comunicación</SectionTitle>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <Label>Responsable Envío</Label>
                        <Select
                            value={formData.comm_responsible}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, comm_responsible: e.target.value as CommResponsible })}
                        >
                            <option value="technology">Tecnología</option>
                            <option value="comms">Comunicaciones</option>
                            <option value="others">Otros</option>
                        </Select>
                    </div>
                    <div>
                        <Label>Fecha Envío</Label>
                        <Input
                            type="datetime-local"
                            value={formData.comm_date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, comm_date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <Label>Mensaje de Comunicación</Label>
                    <Textarea
                        value={formData.comm_message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, comm_message: e.target.value })}
                        placeholder="Mensaje que se enviará a los interesados..."
                    />
                </div>
            </div>
        </div>
    );

    const renderPlanning = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Plan de Cambio (Fases y Actividades)</SectionTitle>
                <button
                    type="button"
                    onClick={() => setFormData({
                        ...formData,
                        plans: [...(formData.plans || []), { phase: '', activity: '', responsible_id: users[0]?.id }]
                    })}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary/80"
                >
                    + Agregar Actividad
                </button>
            </div>

            <div className="space-y-4">
                {formData.plans?.map((plan, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative group">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, plans: formData.plans?.filter((_, i) => i !== idx) })}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <Label>Fase</Label>
                                <Input
                                    value={plan.phase}
                                    onChange={e => {
                                        const newPlans = [...(formData.plans || [])];
                                        newPlans[idx].phase = e.target.value;
                                        setFormData({ ...formData, plans: newPlans });
                                    }}
                                    placeholder="Ej: Preparación"
                                />
                            </div>
                            <div>
                                <Label>Actividad</Label>
                                <Input
                                    value={plan.activity}
                                    onChange={e => {
                                        const newPlans = [...(formData.plans || [])];
                                        newPlans[idx].activity = e.target.value;
                                        setFormData({ ...formData, plans: newPlans });
                                    }}
                                    placeholder="Descripción de la tarea"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <Label>Responsable</Label>
                                <Select
                                    value={plan.responsible_id || ''}
                                    onChange={e => {
                                        const newPlans = [...(formData.plans || [])];
                                        newPlans[idx].responsible_id = e.target.value;
                                        setFormData({ ...formData, plans: newPlans });
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label>Recursos</Label>
                                <Input
                                    value={plan.resources_required || ''}
                                    onChange={e => {
                                        const newPlans = [...(formData.plans || [])];
                                        newPlans[idx].resources_required = e.target.value;
                                        setFormData({ ...formData, plans: newPlans });
                                    }}
                                    placeholder="Hardware, software, etc."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Inicio</Label>
                                    <Input
                                        type="datetime-local"
                                        tabIndex={-1}
                                        value={plan.start_at ? new Date(plan.start_at).toISOString().slice(0, 16) : ''}
                                        onChange={e => {
                                            const newPlans = [...(formData.plans || [])];
                                            newPlans[idx].start_at = e.target.value;
                                            setFormData({ ...formData, plans: newPlans });
                                        }}
                                        className="text-xs px-2"
                                    />
                                </div>
                                <div>
                                    <Label>Fin</Label>
                                    <Input
                                        type="datetime-local"
                                        tabIndex={-1}
                                        value={plan.end_at ? new Date(plan.end_at).toISOString().slice(0, 16) : ''}
                                        onChange={e => {
                                            const newPlans = [...(formData.plans || [])];
                                            newPlans[idx].end_at = e.target.value;
                                            setFormData({ ...formData, plans: newPlans });
                                        }}
                                        className="text-xs px-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderRisks = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Matriz de Riesgos</SectionTitle>
                <button
                    type="button"
                    onClick={() => setFormData({
                        ...formData,
                        risks: [...(formData.risks || []), {
                            risk_description: '', probability: 'low', impact: 'minor', priority: 'low'
                        }]
                    })}
                    className="text-xs font-bold text-primary hover:underline"
                >
                    + Agregar Riesgo
                </button>
            </div>

            <div className="space-y-4">
                {formData.risks?.map((risk, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative group">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, risks: formData.risks?.filter((_, i) => i !== idx) })}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="mb-3">
                            <Label>Riesgo</Label>
                            <Input
                                value={risk.risk_description}
                                onChange={e => {
                                    const newRisks = [...(formData.risks || [])];
                                    newRisks[idx].risk_description = e.target.value;
                                    setFormData({ ...formData, risks: newRisks });
                                }}
                                placeholder="Descripción del riesgo potencial"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                                <Label>Probabilidad</Label>
                                <Select
                                    value={risk.probability}
                                    onChange={e => {
                                        const newRisks = [...(formData.risks || [])];
                                        newRisks[idx].probability = e.target.value as RiskLevel;
                                        setFormData({ ...formData, risks: newRisks });
                                    }}
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Impacto</Label>
                                <Select
                                    value={risk.impact}
                                    onChange={e => {
                                        const newRisks = [...(formData.risks || [])];
                                        newRisks[idx].impact = e.target.value as ImpactLevel;
                                        setFormData({ ...formData, risks: newRisks });
                                    }}
                                >
                                    <option value="minor">Menor</option>
                                    <option value="moderate">Moderado</option>
                                    <option value="major">Mayor</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Prioridad</Label>
                                <Select
                                    value={risk.priority}
                                    onChange={e => {
                                        const newRisks = [...(formData.risks || [])];
                                        newRisks[idx].priority = e.target.value as RiskLevel;
                                        setFormData({ ...formData, risks: newRisks });
                                    }}
                                >
                                    <option value="low">Baja</option>
                                    <option value="medium">Media</option>
                                    <option value="high">Alta</option>
                                </Select>
                            </div>
                            <div>
                                <Label>Responsable</Label>
                                <Select
                                    value={risk.responsible_id || ''}
                                    onChange={e => {
                                        const newRisks = [...(formData.risks || [])];
                                        newRisks[idx].responsible_id = e.target.value;
                                        setFormData({ ...formData, risks: newRisks });
                                    }}
                                >
                                    <option value="">Seleccionar...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Acción de Mitigación</Label>
                            <Input
                                value={risk.mitigation_action || ''}
                                onChange={e => {
                                    const newRisks = [...(formData.risks || [])];
                                    newRisks[idx].mitigation_action = e.target.value;
                                    setFormData({ ...formData, risks: newRisks });
                                }}
                                placeholder="Estrategia para mitigar el riesgo"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAssets = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionTitle>Activos Involucrados</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                {assets.map(asset => {
                    const isSelected = formData.asset_ids?.includes(asset.id);
                    return (
                        <div
                            key={asset.id}
                            onClick={() => {
                                const newAssets = isSelected
                                    ? formData.asset_ids?.filter(id => id !== asset.id)
                                    : [...(formData.asset_ids || []), asset.id];
                                setFormData({ ...formData, asset_ids: newAssets });
                            }}
                            className={`
                                cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between
                                ${isSelected
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-slate-300'}`} />
                                <span className="text-sm font-medium truncate">{asset.name}</span>
                            </div>
                            {isSelected && <CheckCircle className="w-4 h-4" />}
                        </div>
                    );
                })}
            </div>
            {assets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No hay activos registrados en el inventario.
                </p>
            )}
        </div>
    );

    const renderRollback = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Plan de Retorno (Rollback)</SectionTitle>
                <button
                    type="button"
                    onClick={() => setFormData({
                        ...formData,
                        rollbacks: [...(formData.rollbacks || []), { event_trigger: '', activity: '', alternative_strategy: '' }]
                    })}
                    className="text-xs font-bold text-primary hover:underline hover:text-primary/80"
                >
                    + Agregar Estrategia
                </button>
            </div>

            <div className="space-y-4">
                {formData.rollbacks?.map((rb, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative group">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, rollbacks: formData.rollbacks?.filter((_, i) => i !== idx) })}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <Label>Evento Desencadenante</Label>
                                <Input
                                    value={rb.event_trigger}
                                    onChange={e => {
                                        const newRbs = [...(formData.rollbacks || [])];
                                        newRbs[idx].event_trigger = e.target.value;
                                        setFormData({ ...formData, rollbacks: newRbs });
                                    }}
                                    placeholder="¿Qué incidente activa el rollback?"
                                />
                            </div>
                            <div>
                                <Label>Actividad de Retorno</Label>
                                <Input
                                    value={rb.activity}
                                    onChange={e => {
                                        const newRbs = [...(formData.rollbacks || [])];
                                        newRbs[idx].activity = e.target.value;
                                        setFormData({ ...formData, rollbacks: newRbs });
                                    }}
                                    placeholder="Pasos técnicos para revertir"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Estrategia Alternativa</Label>
                            <Input
                                value={rb.alternative_strategy || ''}
                                onChange={e => {
                                    const newRbs = [...(formData.rollbacks || [])];
                                    newRbs[idx].alternative_strategy = e.target.value;
                                    setFormData({ ...formData, rollbacks: newRbs });
                                }}
                                placeholder="Plan B si el rollback falla"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
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
                            {activeTab === 'general' && renderGeneral()}
                            {activeTab === 'matrix' && renderMatrix()}
                            {activeTab === 'planning' && renderPlanning()}
                            {activeTab === 'risks' && renderRisks()}
                            {activeTab === 'assets' && renderAssets()}
                            {activeTab === 'rollback' && renderRollback()}
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
