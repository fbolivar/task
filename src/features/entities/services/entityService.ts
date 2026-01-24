import { createClient } from '@/lib/supabase/client';
import { Entity, EntityFormData } from '../types';

const mapFormDataToPayload = (form: EntityFormData) => {
    // Force numeric conversion to avoid issues with strings from DB
    return {
        name: String(form.name || '').trim(),
        type: form.type,
        contact_info: {
            email: String(form.email || '').trim(),
            phone: String(form.phone || '').trim()
        },
        website: form.website ? String(form.website).trim() : null,
        address: form.address ? String(form.address).trim() : null,
        contact_name: form.contact_name ? String(form.contact_name).trim() : null,
        contact_email: form.contact_email ? String(form.contact_email).trim() : null,
        budget_q1: Number(form.budget_q1) || 0,
        budget_q2: Number(form.budget_q2) || 0,
        budget_q3: Number(form.budget_q3) || 0,
        budget_q4: Number(form.budget_q4) || 0,
        logo_url: form.logo_url && String(form.logo_url).trim() !== '' ? String(form.logo_url).trim() : null,
    };
};

export const entityService = {
    async getEntities(): Promise<Entity[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Service: Error fetching entities', error);
            throw error;
        }
        return data || [];
    },

    async getEntityById(id: string): Promise<Entity | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) return null;
        return data;
    },

    async createEntity(entity: EntityFormData): Promise<Entity> {
        const supabase = createClient();
        const payload = mapFormDataToPayload(entity);

        const { data, error } = await supabase
            .from('entities')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Service: Error creating entity', error);
            throw error;
        }
        return data;
    },

    async updateEntity(id: string, entity: EntityFormData): Promise<Entity> {
        const supabase = createClient();
        const payload = mapFormDataToPayload(entity);

        // Remove .single() and use .select() to see result
        const { data, error } = await supabase
            .from('entities')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) {
            console.error('Service: Error updating entity', error);
            throw error;
        }

        if (!data || data.length === 0) {
            throw new Error(`No se encontró la entidad con ID ${id} para actualizar. Verifique permisos RLS.`);
        }

        return data[0];
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
    }
};
