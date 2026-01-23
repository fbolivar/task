import { createClient } from '@/lib/supabase/client';
import { FinancialRecord, BudgetLine, FinancialRecordType } from '../types';

export const financeService = {
    async getFinancialRecords(filters?: {
        projectId?: string;
        entityId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<FinancialRecord[]> {
        const supabase = createClient();
        let query = supabase
            .from('project_financial_records')
            .select('*, project:projects(name), entity:entities(name)')
            .order('date', { ascending: false });

        if (filters?.projectId) query = query.eq('project_id', filters.projectId);
        if (filters?.entityId) query = query.eq('entity_id', filters.entityId);
        if (filters?.startDate) query = query.gte('date', filters.startDate);
        if (filters?.endDate) query = query.lte('date', filters.endDate);

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async createFinancialRecord(record: Omit<FinancialRecord, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialRecord> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_financial_records')
            .insert(record)
            .select('*, project:projects(name), entity:entities(name)')
            .single();

        if (error) throw error;
        return data;
    },

    async getBudgetLines(projectId: string): Promise<BudgetLine[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('project_budget_lines')
            .select('*')
            .eq('project_id', projectId);

        if (error) throw error;
        return data || [];
    },

    async syncProjectActualCost(projectId: string): Promise<void> {
        const supabase = createClient();

        // Calculate total expenses for the project
        const { data: records, error: fetchError } = await supabase
            .from('project_financial_records')
            .select('amount')
            .eq('project_id', projectId)
            .eq('type', 'Gasto');

        if (fetchError) throw fetchError;

        const totalActualCost = records?.reduce((acc, r) => acc + Number(r.amount), 0) || 0;

        // Update projects table
        const { error: updateError } = await supabase
            .from('projects')
            .update({ actual_cost: totalActualCost })
            .eq('id', projectId);

        if (updateError) throw updateError;
    },

    async deleteFinancialRecord(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('project_financial_records')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
