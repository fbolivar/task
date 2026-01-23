import { createClient } from '@/lib/supabase/client';
import { LoginCredentials, SignupCredentials, Profile } from '../types';

export const authService = {
    async signIn({ email, password }: LoginCredentials) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },

    async signUp({ email, password, fullName }: SignupCredentials) {
        const supabase = createClient();

        // 1. Create auth user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;

        // 2. Create profile in profiles table
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                    email: email,
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // Don't throw - user was created successfully
            }
        }

        return data;
    },

    async signOut() {
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getProfile(userId: string): Promise<Profile | null> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*, role:roles(*), profile_entities(entity:entities(id, name))')
            .eq('id', userId)
            .single();

        if (error) {
            // Si el perfil no existe (PGRST116 = no rows), intentar crearlo
            if (error.code === 'PGRST116') {
                return this.createProfileFromAuth(userId);
            }
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    },

    async createProfileFromAuth(userId: string): Promise<Profile | null> {
        const supabase = createClient();

        // Obtener datos del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Crear perfil con datos básicos
        const { data, error } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
            })
            .select('*, role:roles(*)')
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            return null;
        }
        return data;
    },

    async updateProfile(userId: string, updates: Partial<Profile>) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePassword(password: string) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.updateUser({
            password: password
        });
        if (error) throw error;
        return data;
    },

    async getAllProfiles(): Promise<Profile[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('profiles')
            .select('*, role:roles(*)')
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data || [];
    },
};
