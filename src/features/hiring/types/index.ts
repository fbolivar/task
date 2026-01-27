export type HiringStatus = 'En Proceso' | 'Adjudicado' | 'Legalizado' | 'Cancelado';

export interface HiringPhase {
    code: string;
    name: string;
    weight: number;
}

export const HIRING_PHASES: HiringPhase[] = [
    { code: 'ficha_tecnica', name: 'Ficha Técnica', weight: 10 },
    { code: 'estudio_mercado', name: 'Estudio de Mercado', weight: 15 },
    { code: 'cdp_vigencia', name: 'CDP/Vigencia Futura', weight: 10 },
    { code: 'estudio_previo', name: 'Estudio Previo/Adición', weight: 20 },
    { code: 'indicadores_fin', name: 'Análisis Indicadores Financieros', weight: 10 },
    { code: 'radicacion_contratos', name: 'Radicación en Contratos', weight: 15 },
    { code: 'proceso_adjudicado', name: 'Proceso Adjudicado', weight: 10 },
    { code: 'legalizacion_contrato', name: 'Legalización Contrato', weight: 10 }
];

export interface HiringPhaseTracking {
    id: string;
    process_id: string;
    phase_code: string;
    is_completed: boolean;
    completed_at: string | null;
    completed_by: string | null;
    notes: string | null;
    evidence_link: string | null;
    updated_at: string;
}

export interface HiringProcess {
    id: string;
    entity_id: string;
    project_id: string | null;
    title: string;
    description: string | null;
    assigned_to: string | null;
    status: HiringStatus;
    total_progress: number;
    estimated_amount: number;
    created_at: string;
    updated_at: string;
    project?: { id: string; name: string };
    assignee?: { id: string; full_name: string; avatar_url?: string | null };
    phases?: HiringPhaseTracking[];
}

export interface HiringProcessFormData {
    entity_id: string;
    project_id: string | null;
    title: string;
    description: string;
    assigned_to: string | null;
    estimated_amount: number;
    status?: HiringStatus;
}
