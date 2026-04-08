'use client';

import { X } from 'lucide-react';
import { ChangeRequestFormData, ImpactLevel, RiskLevel } from '../types';
import { Input, Label, SectionTitle, Select } from './form-primitives';

interface ChangeFormRisksProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
    users: { id: string; full_name: string }[];
}

export function ChangeFormRisks({ formData, onChange, users }: ChangeFormRisksProps) {
    const addRisk = () =>
        onChange({
            ...formData,
            risks: [
                ...(formData.risks || []),
                { risk_description: '', probability: 'low', impact: 'minor', priority: 'low' },
            ],
        });

    const removeRisk = (idx: number) =>
        onChange({ ...formData, risks: formData.risks?.filter((_, i) => i !== idx) });

    const updateRisk = (idx: number, field: string, value: string) => {
        const newRisks = [...(formData.risks || [])];
        (newRisks[idx] as unknown as Record<string, unknown>)[field] = value;
        onChange({ ...formData, risks: newRisks });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <SectionTitle>Matriz de Riesgos</SectionTitle>
                <button
                    type="button"
                    onClick={addRisk}
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
                            onClick={() => removeRisk(idx)}
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="mb-3">
                            <Label>Riesgo</Label>
                            <Input
                                value={risk.risk_description}
                                onChange={e => updateRisk(idx, 'risk_description', e.target.value)}
                                placeholder="Descripción del riesgo potencial"
                            />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                                <Label>Probabilidad</Label>
                                <Select
                                    value={risk.probability}
                                    onChange={e => updateRisk(idx, 'probability', e.target.value as RiskLevel)}
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
                                    onChange={e => updateRisk(idx, 'impact', e.target.value as ImpactLevel)}
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
                                    onChange={e => updateRisk(idx, 'priority', e.target.value as RiskLevel)}
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
                                    onChange={e => updateRisk(idx, 'responsible_id', e.target.value)}
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
                                onChange={e => updateRisk(idx, 'mitigation_action', e.target.value)}
                                placeholder="Estrategia para mitigar el riesgo"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
