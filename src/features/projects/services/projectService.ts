import { createClient } from '@/lib/supabase/client';
import { Project, ProjectFormData } from '../types';

export const projectService = {
    async getProjects(activeEntityId: string | 'all'): Promise<Project[]> {
        const supabase = createClient();

        let query = supabase
            .from('projects')
            .select('*, entity:entities(id, name), sub_projects(*), budget, has_budget, expenses:project_recurrent_expenses(*)')
            .order('created_at', { ascending: false });

        if (activeEntityId !== 'all') {
            query = query.eq('entity_id', activeEntityId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []) as unknown as Project[];
    },

    async createProject(project: ProjectFormData): Promise<Project> {
        const supabase = createClient();

        // Separate expenses from project data
        const { expenses, ...projectData } = project;

        const { data: stringData, error } = await supabase
            .from('projects')
            .insert(projectData)
            .select('id')
            .single();

        if (error) throw error;
        const newProjectId = stringData.id;

        // Insert expenses if any
        if (expenses && expenses.length > 0) {
            const expensesToInsert = expenses.map(e => ({
                ...e,
                project_id: newProjectId
            }));
            const { error: expenseError } = await supabase
                .from('project_recurrent_expenses')
                .insert(expensesToInsert);

            if (expenseError) {
                console.error("Error creating expenses", expenseError);
                // Non-blocking but warning
            }
        }

        // Return full object
        return this.getProjectById(newProjectId);
    },

    async updateProject(id: string, updates: Partial<ProjectFormData>): Promise<Project> {
        const supabase = createClient();
        const { expenses, ...projectData } = updates;

        const { error } = await supabase
            .from('projects')
            .update(projectData)
            .eq('id', id);

        if (error) throw error;

        // Handle expenses update (Full replacement for simplicity or upsert)
        // Strategy: Delete all for project and re-insert active ones
        // This is safe for "settings" style lists. 
        if (expenses) {
            const { error: delError } = await supabase
                .from('project_recurrent_expenses')
                .delete()
                .eq('project_id', id);
            if (delError) throw delError;

            if (expenses.length > 0) {
                const expensesToInsert = expenses.map(e => ({
                    ...e,
                    project_id: id
                }));
                const { error: insError } = await supabase
                    .from('project_recurrent_expenses')
                    .insert(expensesToInsert);
                if (insError) throw insError;
            }
        }

        return this.getProjectById(id);
    },

    async getProjectById(id: string): Promise<Project> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('projects')
            .select('*, entity:entities(id, name), sub_projects(*), budget, has_budget, expenses:project_recurrent_expenses(*)')
            .eq('id', id)
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
