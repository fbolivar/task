import { createClient } from '@/lib/supabase/client';

export interface EntityThresholds {
    id: string;
    entity_id: string;
    budget_warning_percent: number;
    budget_critical_percent: number;
    task_risk_check_enabled: boolean;
    auto_reassign_enabled: boolean;
    reassign_after_days: number;
    backup_assignee_id: string | null;
    updated_at: string;
}

export const thresholdService = {
    async getThresholds(entityId: string): Promise<EntityThresholds | null> {
        if (!entityId || entityId === 'all') {
            return null;
        }

        const supabase = createClient();
        const { data, error } = await supabase
            .from('entity_thresholds')
            .select('*')
            .eq('entity_id', entityId)
            .maybeSingle();

        if (error) {
            // Only log if it's a real error, not a "no rows" situation
            if (error.code !== 'PGRST116') {
                console.error('Error fetching thresholds:', error);
            }
            return null;
        }
        return data;
    },

    async updateThresholds(entityId: string, updates: Partial<EntityThresholds>): Promise<EntityThresholds> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entity_thresholds')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('entity_id', entityId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
