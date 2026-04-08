'use client';

import { ChangeRequestFormData, ChangeType } from '../types';
import { Input, Label, Select, Textarea } from './form-primitives';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface ChangeFormGeneralProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
    projects: { id: string; name: string }[];
    users: { id: string; full_name: string }[];
    isEditMode: boolean;
}

export function ChangeFormGeneral({ formData, onChange, projects, users, isEditMode }: ChangeFormGeneralProps) {
    const { t } = useSettings();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Label>{t('tasks.form.project')}</Label>
                    <Select
                        value={formData.project_id}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, project_id: e.target.value })}
                        disabled={isEditMode}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Autorizador (Quien aprueba)</Label>
                    <Select
                        value={formData.approver_id || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, approver_id: e.target.value })}
                    >
                        <option value="">Seleccionar...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Tipo de Cambio</Label>
                    <Select
                        value={formData.change_type || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...formData, change_type: e.target.value as ChangeType })}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...formData, title: e.target.value })}
                    placeholder="Resumen corto del cambio"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <Label>Fecha Inicio</Label>
                    <Input
                        type="datetime-local"
                        value={formData.start_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...formData, start_at: e.target.value })}
                    />
                </div>
                <div>
                    <Label>Fecha Fin</Label>
                    <Input
                        type="datetime-local"
                        value={formData.end_at}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...formData, end_at: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <Label>Alcance</Label>
                <Textarea
                    value={formData.scope}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...formData, scope: e.target.value })}
                    placeholder="Descripción detallada del alcance..."
                />
            </div>

            <div>
                <Label>Justificación</Label>
                <Textarea
                    value={formData.justification}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...formData, justification: e.target.value })}
                    placeholder="¿Por qué es necesario este cambio?"
                />
            </div>
        </div>
    );
}
