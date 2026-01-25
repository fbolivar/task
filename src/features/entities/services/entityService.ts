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

};
