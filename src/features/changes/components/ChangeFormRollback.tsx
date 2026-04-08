'use client';

import { X } from 'lucide-react';
import { ChangeRequestFormData } from '../types';
import { Input, Label, SectionTitle } from './form-primitives';

interface ChangeFormRollbackProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
}

export function ChangeFormRollback({ formData, onChange }: ChangeFormRollbackProps) {
    const addRollback = () =>
        onChange({
            ...formData,
            rollbacks: [
                ...(formData.rollbacks || []),
                { event_trigger: '', activity: '', alternative_strategy: '' },
            ],
        });

    const removeRollback = (idx: number) =>
        onChange({ ...formData, rollbacks: formData.rollbacks?.filter((_, i) => i !== idx) });

    const updateRollback = (idx: number, field: string, value: string) => {
        const newRbs = [...(formData.rollbacks || [])];
        (newRbs[idx] as unknown as Record<string, unknown>)[field] = value;
        onChange({ ...formData, rollbacks: newRbs });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Plan de Retorno (Rollback)</SectionTitle>
                <button
                    type="button"
                    onClick={addRollback}
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
                            onClick={() => removeRollback(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div>
                                <Label>Evento Desencadenante</Label>
                                <Input
                                    value={rb.event_trigger}
                                    onChange={e => updateRollback(idx, 'event_trigger', e.target.value)}
                                    placeholder="¿Qué incidente activa el rollback?"
                                />
                            </div>
                            <div>
                                <Label>Actividad de Retorno</Label>
                                <Input
                                    value={rb.activity}
                                    onChange={e => updateRollback(idx, 'activity', e.target.value)}
                                    placeholder="Pasos técnicos para revertir"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Estrategia Alternativa</Label>
                            <Input
                                value={rb.alternative_strategy || ''}
                                onChange={e => updateRollback(idx, 'alternative_strategy', e.target.value)}
                                placeholder="Plan B si el rollback falla"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
