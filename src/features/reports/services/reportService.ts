import { createClient } from '@/lib/supabase/client';
import { ReportFilter, ReportStats, ProjectData } from '../types';

export const reportService = {
    async getProjectsForFilter(activeEntityId: string | 'all'): Promise<ProjectData[]> {
        const supabase = createClient();
        let query = supabase.from('projects').select('id, name, entity_id, entities(name, logo_url)');

        if (activeEntityId !== 'all') {
            query = query.eq('entity_id', activeEntityId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            entity_id: p.entity_id,
            entity_name: p.entities?.name,
            entity_logo_url: p.entities?.logo_url
        }));
    },

    async getReportStats(filter: ReportFilter): Promise<ReportStats> {
        // Delegate to Server Action to bypass RLS and ensure correct data visibility
        // dynamic import to avoid bundling server code in client
        const { generateReportStats } = await import('../actions/generateReport');
        return generateReportStats(filter);
    },
};

// Helper: Calculate Burndown

