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
            .select('*, role:roles(*), profile_entities(entity:entities(id, name, is_change_management_enabled))')
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

        // Si tiene acceso a todas las entidades, poblar profile_entities con todas las entidades existentes
        // para que componentes como el Sidebar puedan verificar estados (ej: gestión de cambios) correctamente
        if (data?.has_all_entities_access) {
            const { data: allEntities } = await supabase
                .from('entities')
                .select('id, name, is_change_management_enabled')
                .order('name');

            if (allEntities) {
                data.profile_entities = allEntities.map((entity: any) => ({ entity }));
            }
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
                role_id: 'c1664b71-4a07-41c4-944d-e4d2a464c595' // Default to Operativo
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

    async resetPasswordForEmail(email: string) {
        const supabase = createClient();
        // Redirect to a page that handles password updates (e.g. settings or dashboard)
        // Ideally, it should be a dedicated /update-password page for "Recovery Mode"
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `https://gespro.bc-security.com/login`,
        });
        if (error) throw error;
        return data;
    },

    // --- MFA / 2FA Methods ---

    async enrollMFA() {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.enroll({
            factorType: 'totp',
        });
        if (error) throw error;
        return data;
    },

    async verifyMFA(factorId: string, code: string, challengeId?: string) {
        const supabase = createClient();
        if (challengeId) {
            const { data, error } = await supabase.auth.mfa.verify({
                factorId,
                challengeId,
                code,
            });
            if (error) throw error;
            return data;
        } else {
            // For enrollment verification
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code,
            });
            if (error) throw error;
            return data;
        }
    },

    async listFactors() {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;
        return data;
    },

    async unenrollMFA(factorId: string) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) throw error;
        return data;
    },

    async getAssuranceLevel() {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) throw error;
        return data;
    }
};
