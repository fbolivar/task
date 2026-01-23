import { createClient } from '@/lib/supabase/client';
import { Asset, AssetFormData } from '../types';

export const assetService = {
    async getAssets(entityId?: string | null): Promise<Asset[]> {
        const supabase = createClient();

        let query = supabase
            .from('assets')
            .select('*, entity:entities(name), assignee:profiles(full_name)')
            .order('created_at', { ascending: false });

        // Solo filtrar si entityId es válido y no es 'all'
        if (entityId && entityId !== 'all') {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;

        if (error) {
            // Errores de permisos no deben romper la app
            if (error.code === 'PGRST301' || error.code === '42501') {
                console.warn('Assets: Sin permisos de acceso');
                return [];
            }
            throw error;
        }
        return data || [];
    },

    async createAsset(asset: AssetFormData): Promise<Asset> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('assets')
            .insert(asset)
            .select('*, entity:entities(name), assignee:profiles(full_name)')
            .single();

        if (error) throw error;
        return data;
    },

    async updateAsset(id: string, asset: Partial<AssetFormData>): Promise<Asset> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('assets')
            .update(asset)
            .eq('id', id)
            .select('*, entity:entities(name), assignee:profiles(full_name)')
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAsset(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
