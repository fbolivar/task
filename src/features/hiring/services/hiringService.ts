import { createClient } from '@/lib/supabase/client';
import { HiringProcess, HiringProcessFormData, HiringPhaseTracking, HIRING_PHASES } from '../types';

export const hiringService = {
    async getProcesses(entityId?: string): Promise<HiringProcess[]> {
        const supabase = createClient();
        let query = supabase
            .from('hiring_processes')
            .select('*, project:projects!project_id(id, name), assignee:profiles!assigned_to(id, full_name)')
            .order('created_at', { ascending: false });

        if (entityId) {
            query = query.eq('entity_id', entityId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as unknown as HiringProcess[];
    },

    async getProcessById(id: string): Promise<HiringProcess> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('hiring_processes')
            .select('*, project:projects(id, name), assignee:profiles(id, full_name), phases:hiring_phases_tracking(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as HiringProcess;
    },

    async createProcess(data: HiringProcessFormData): Promise<HiringProcess> {
        const supabase = createClient();

        // 1. Create Process
        const { data: newProcess, error } = await supabase
            .from('hiring_processes')
            .insert(data)
            .select()
            .single();

        if (error) throw error;

        // 2. Initialize Phases
        const phaseInserts = HIRING_PHASES.map(phase => ({
            process_id: newProcess.id,
            phase_code: phase.code,
            is_completed: false
        }));

        const { error: phaseError } = await supabase
            .from('hiring_phases_tracking')
            .insert(phaseInserts);

        if (phaseError) throw phaseError;

        return this.getProcessById(newProcess.id);
    },

    async updatePhaseStatus(processId: string, phaseCode: string, completed: boolean): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Update Phase
        const { error: phaseError } = await supabase
            .from('hiring_phases_tracking')
            .update({
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
                completed_by: completed ? user?.id : null
            })
            .eq('process_id', processId)
            .eq('phase_code', phaseCode);

        if (phaseError) throw phaseError;

        // 2. Recalculate total progress
        await this.recalculateProgress(processId);
    },

    async recalculateProgress(processId: string): Promise<number> {
        const supabase = createClient();

        // Fetch all phases for this process
        const { data: phases, error } = await supabase
            .from('hiring_phases_tracking')
            .select('phase_code, is_completed')
            .eq('process_id', processId);

        if (error) throw error;

        // Calculate weighted progress
        let progress = 0;
        phases?.forEach((p: any) => {
            if (p.is_completed) {
                const phaseDef = HIRING_PHASES.find(h => h.code === p.phase_code);
                if (phaseDef) progress += phaseDef.weight;
            }
        });

        // Determine general status
        let status = 'En Proceso';
        if (progress >= 100) status = 'Legalizado';
        else if (progress >= 80) status = 'Adjudicado';

        // Update process
        await supabase
            .from('hiring_processes')
            .update({
                total_progress: progress,
                status: status
            })
            .eq('id', processId);

        return progress;
    },

    async updateProcess(id: string, data: Partial<HiringProcessFormData>): Promise<HiringProcess> {
        const supabase = createClient();
        const { error } = await supabase
            .from('hiring_processes')
            .update(data)
            .eq('id', id);

        if (error) throw error;
        return this.getProcessById(id);
    },

    async deleteProcess(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('hiring_processes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
