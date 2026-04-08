export interface AuditLog {
    id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    description: string;
    created_at: string;
    user?: { full_name: string; email: string };
}

export interface SecurityLog {
    id: string;
    user_id: string | null;
    event_type: string;
    severity: 'info' | 'warning' | 'critical';
    ip_address: string | null;
    user_agent: string | null;
    details: Record<string, unknown>;
    created_at: string;
    user?: { full_name: string; email: string };
}
