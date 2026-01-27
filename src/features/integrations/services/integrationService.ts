import { createClient } from '@/lib/supabase/client';
import { Integration, IntegrationConfig } from '../types';

export const integrationService = {
    async getIntegrations(): Promise<Integration[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('integrations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleIntegration(id: string, isActive: boolean): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('integrations')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    },

    async saveGmailConfig(id: string, config: IntegrationConfig): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('integrations')
            .update({
                config,
                is_active: true // Auto-activate on save? Or let user decide. Let's auto-activate for UX.
            })
            .eq('id', id);

        if (error) throw error;
    },

    async testGmailConnection(credentials: { email: string; appPassword: string; to: string }): Promise<void> {
        const response = await fetch('/api/integrations/test-gmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.appPassword,
                to: credentials.to,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al probar la conexión');
        }
    },
    async configureGoogleDrive(config: any): Promise<void> {
        const supabase = createClient();

        // 1. Check if integration exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('provider', 'google_drive')
            .single();

        if (existing) {
            // Update
            const { error } = await supabase
                .from('integrations')
                .update({
                    config: config,
                    is_active: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // Create
            const { error } = await supabase
                .from('integrations')
                .insert({
                    provider: 'google_drive',
                    name: 'Google Drive',
                    config: config,
                    is_active: true
                });
            if (error) throw error;
        }
    }
};
