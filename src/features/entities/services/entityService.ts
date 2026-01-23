import { createClient } from '@/lib/supabase/client';
import { Entity, EntityFormData } from '../types';

export const entityService = {
    async getEntities(): Promise<Entity[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getEntityById(id: string): Promise<Entity | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    },

    async createEntity(entity: EntityFormData): Promise<Entity> {
        const supabase = createClient();
        const payload = this.mapFormDataToPayload(entity);

        const { data, error } = await supabase
            .from('entities')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateEntity(id: string, entity: EntityFormData): Promise<Entity> {
        const supabase = createClient();
        const payload = this.mapFormDataToPayload(entity);

        const { data, error } = await supabase
            .from('entities')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEntity(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('entities')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getQuarterlyExpenses(): Promise<Record<string, number>> {
        const supabase = createClient();
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-12
        const quarter = Math.ceil(month / 3);
        const qMonths = quarter === 1 ? [1, 2, 3] : quarter === 2 ? [4, 5, 6] : quarter === 3 ? [7, 8, 9] : [10, 11, 12];

        const { data, error } = await supabase
            .from('entity_annual_expense_trend')
            .select('entity_id, total_expenses')
            .eq('year', year)
            .in('month', qMonths);

        if (error) throw error;

        const results: Record<string, number> = {};
        data?.forEach((row: any) => {
            results[row.entity_id] = (results[row.entity_id] || 0) + Number(row.total_expenses);
        });

        return results;
    },

    mapFormDataToPayload(form: EntityFormData) {
        return {
            name: form.name,
            type: form.type,
            contact_info: { email: form.email, phone: form.phone },
            website: form.website || null,
            address: form.address || null,
            contact_name: form.contact_name || null,
            contact_email: form.contact_email || null,
            budget_q1: form.budget_q1 || 0,
            budget_q2: form.budget_q2 || 0,
            budget_q3: form.budget_q3 || 0,
            budget_q4: form.budget_q4 || 0,
        };
    }
};
