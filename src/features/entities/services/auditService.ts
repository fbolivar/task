import { createClient } from '@/lib/supabase/client';

export interface ReassignmentLog {
    id: string;
    created_at: string;
    reason: string;
    task_title: string;
    task_priority: string;
    previous_assignee_name: string;
    new_assignee_name: string;
    entity_id: string;
    entity_name: string;
}

export const auditService = {
    async getReassignmentLogs(entityId: string | 'all'): Promise<ReassignmentLog[]> {
        const supabase = createClient();
        let query = supabase
            .from('v_audit_reassignments')
            .select('*')
            .order('created_at', { ascending: false });

        if (entityId !== 'all') {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
};
