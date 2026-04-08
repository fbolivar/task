'use client';

import { ChangeRequestFormData, CommResponsible, ImpactLevel, RiskLevel } from '../types';
import { Input, Label, SectionTitle, Select, Textarea } from './form-primitives';

interface ChangeFormMatrixCommProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
}

export function ChangeFormMatrixComm({ formData, onChange }: ChangeFormMatrixCommProps) {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionTitle>Evaluación de Impacto y Riesgo</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <Label>Impacto</Label>
                    <Select
                        value={formData.matrix_impact}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, matrix_impact: e.target.value as ImpactLevel })}
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
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, matrix_urgency: e.target.value as RiskLevel })}
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
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, matrix_prioritization: e.target.value as RiskLevel })}
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
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, comm_responsible: e.target.value as CommResponsible })}
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
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...formData, comm_date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <Label>Mensaje de Comunicación</Label>
                    <Textarea
                        value={formData.comm_message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...formData, comm_message: e.target.value })}
                        placeholder="Mensaje que se enviará a los interesados..."
                    />
                </div>
            </div>
        </div>
    );
}
