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
        const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Non-JSON response from server:', text);
            throw new Error(`Error del servidor (No JSON): ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
            throw new Error(data.error || 'Error creando usuario');
        }

        return {
            emailSent: data.emailSent,
            emailError: data.emailError
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

    async deleteUser(userId: string): Promise<void> {
        const response = await fetch('/api/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Error eliminando usuario');
        }
    },

    async toggleStatus(id: string, status: boolean): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase.from('profiles').update({ is_active: status }).eq('id', id);
        if (error) throw error;
    },

    async adminUpdatePassword(userId: string, newPassword: string): Promise<void> {
        const response = await fetch('/api/users/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, newPassword })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Error actualizando contraseña');
        }
    }
};
