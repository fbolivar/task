export type ChangeStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'implemented';
export type ChangePriority = 'low' | 'medium' | 'high' | 'critical';
export type ChangeType = 'telecom' | 'telephony' | 'security' | 'database' | 'apps' | 'infra';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ImpactLevel = 'minor' | 'moderate' | 'major';
export type CommResponsible = 'comms' | 'technology' | 'others';

export interface ChangePlan {
    id?: string;
    phase: string;
    activity: string;
    resources_required?: string;
    responsible_id?: string;
    responsible?: { full_name: string };
    start_at?: string;
    end_at?: string;
}

export interface ChangeRisk {
    id?: string;
    risk_description: string;
    responsible_id?: string;
    probability: RiskLevel;
    impact: ImpactLevel;
    priority: RiskLevel;
    mitigation_action?: string;
}

export interface ChangeRollback {
    id?: string;
    event_trigger: string;
    alternative_strategy?: string;
    activity: string;
    responsible_id?: string;
}

export interface ChangeFollowup {
    id?: string;
    test_performed: string;
    expected_result: string;
    observations?: string;
    is_effective?: boolean;
}

export interface ChangeRequest {
    id: string;
    code: string;
    project_id: string;
    task_id?: string;
    requester_id: string;
    // General
    title: string;
    description: string;
    justification: string;
    change_type?: ChangeType;
    scope?: string;
    start_at?: string;
    end_at?: string;
    // Matrix
    matrix_impact?: ImpactLevel;
    matrix_urgency?: RiskLevel;
    matrix_prioritization?: RiskLevel;
    // Communications
    comm_message?: string;
    comm_date?: string;
    comm_responsible?: CommResponsible;
    // Workflow
    status: ChangeStatus;
    priority: ChangePriority;
    approver_id?: string;
    approval_date?: string;
    created_at: string;
    // Relations
    project?: {
        name: string;
        entity?: {
            name: string;
            logo_url: string | null;
        }
    };
    requester?: { full_name: string; email: string };
    approver?: { full_name: string };
    task?: { title: string };
    plans?: ChangePlan[];
    risks?: ChangeRisk[];
    rollbacks?: ChangeRollback[];
    assets?: { id: string, name: string }[];
}

export interface ChangeRequestFormData {
    project_id: string;
    task_id?: string | null;
    title: string;
    description: string;
    justification: string;
    change_type?: ChangeType;
    scope?: string;
    start_at?: string;
    end_at?: string;
    matrix_impact?: ImpactLevel;
    matrix_urgency?: RiskLevel;
    matrix_prioritization?: RiskLevel;
    comm_message?: string;
    comm_date?: string;
    comm_responsible?: CommResponsible;
    priority: ChangePriority;
    approver_id?: string;
    // Nested writes
    plans?: ChangePlan[];
    risks?: ChangeRisk[];
    rollbacks?: ChangeRollback[];
    asset_ids?: string[];
}
