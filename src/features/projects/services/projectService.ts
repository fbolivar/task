import { createClient } from '@/lib/supabase/client';
import { Project, ProjectFormData } from '../types';

export const projectService = {
    async getProjects(activeEntityId: string | 'all'): Promise<Project[]> {
        const supabase = createClient();

        let query = supabase
            .from('projects')
            .select('*, entity:entities(id, name), sub_projects(*)')
            .order('created_at', { ascending: false });

        if (activeEntityId !== 'all') {
            query = query.eq('entity_id', activeEntityId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map any legacy response naming to our clean type if necessary
        return (data || []) as unknown as Project[];
    },

    async createProject(project: ProjectFormData): Promise<Project> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('projects')
            .insert(project)
            .select('*, entity:entities(id, name), sub_projects(*)')
            .single();

        if (error) throw error;
        return data as unknown as Project;
    },

    async updateProject(id: string, updates: Partial<ProjectFormData>): Promise<Project> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select('*, entity:entities(id, name), sub_projects(*)')
            .single();

        if (error) throw error;
        return data as unknown as Project;
    },

    async deleteProject(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
