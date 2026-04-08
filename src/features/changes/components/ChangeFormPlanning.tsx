'use client';

import { X } from 'lucide-react';
import { ChangeRequestFormData } from '../types';
import { Input, Label, SectionTitle, Select } from './form-primitives';

interface ChangeFormPlanningProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
    users: { id: string; full_name: string }[];
}

export function ChangeFormPlanning({ formData, onChange, users }: ChangeFormPlanningProps) {
    const addPlan = () =>
        onChange({
            ...formData,
            plans: [...(formData.plans || []), { phase: '', activity: '', responsible_id: users[0]?.id }],
        });

    const removePlan = (idx: number) =>
        onChange({ ...formData, plans: formData.plans?.filter((_, i) => i !== idx) });

    const updatePlan = (idx: number, field: string, value: string) => {
        const newPlans = [...(formData.plans || [])];
        (newPlans[idx] as unknown as Record<string, unknown>)[field] = value;
        onChange({ ...formData, plans: newPlans });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Plan de Cambio (Fases y Actividades)</SectionTitle>
                <button
                    type="button"
                    onClick={addPlan}
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
                            onClick={() => removePlan(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <Label>Fase</Label>
                                <Input
                                    value={plan.phase}
                                    onChange={e => updatePlan(idx, 'phase', e.target.value)}
                                    placeholder="Ej: Preparación"
                                />
                            </div>
                            <div>
                                <Label>Actividad</Label>
                                <Input
                                    value={plan.activity}
                                    onChange={e => updatePlan(idx, 'activity', e.target.value)}
                                    placeholder="Descripción de la tarea"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <Label>Responsable</Label>
                                <Select
                                    value={plan.responsible_id || ''}
                                    onChange={e => updatePlan(idx, 'responsible_id', e.target.value)}
                                >
                                    <option value="">Seleccionar...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </Select>
                            </div>
                            <div>
                                <Label>Recursos</Label>
                                <Input
                                    value={plan.resources_required || ''}
                                    onChange={e => updatePlan(idx, 'resources_required', e.target.value)}
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
                                        onChange={e => updatePlan(idx, 'start_at', e.target.value)}
                                        className="text-xs px-2"
                                    />
                                </div>
                                <div>
                                    <Label>Fin</Label>
                                    <Input
                                        type="datetime-local"
                                        tabIndex={-1}
                                        value={plan.end_at ? new Date(plan.end_at).toISOString().slice(0, 16) : ''}
                                        onChange={e => updatePlan(idx, 'end_at', e.target.value)}
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
}
