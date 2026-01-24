import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserFormData, Role, EntityShort } from '../types';

export const userService = {
    async getUsers(): Promise<UserProfile[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*, role:roles(id, name), profile_entities(entity:entities(id, name))')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []) as any[];
    },

    async getRoles(): Promise<Role[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('roles')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getEntities(): Promise<EntityShort[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('entities')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async createUser(user: UserFormData): Promise<{ emailSent: boolean; emailError?: string }> {
        const supabase = createClient();
        const { data, error } = await supabase.functions.invoke('admin-create-user', {
            body: user
        });

        if (error) {
            const body = await error.context?.json?.().catch(() => null);
            throw new Error(body?.error || error.message || 'Error invocando función de creación');
        }

        if (data?.error) throw new Error(data.error);

        return {
            emailSent: data?.emailSent || false,
            emailError: data?.emailError
        };
    },

    async updateUser(id: string, user: UserFormData): Promise<void> {
        const supabase = createClient();

        // 1. Update Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: user.full_name,
                role_id: user.role_id || null,
                has_all_entities_access: user.has_all_entities_access,
                is_active: user.is_active
            })
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Update Entity Assignments
        await supabase.from('profile_entities').delete().eq('profile_id', id);

        if (!user.has_all_entities_access && user.entity_ids.length > 0) {
            const entityInserts = user.entity_ids.map(eid => ({
                profile_id: id,
                entity_id: eid
            }));
            const { error: entityError } = await supabase.from('profile_entities').insert(entityInserts);
            if (entityError) throw entityError;
        }
    },

    async deleteUser(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },

    async toggleStatus(id: string, status: boolean): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('profiles').update({ is_active: status }).eq('id', id);
        if (error) throw error;
    }
};
