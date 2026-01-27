import { useState, useEffect, useCallback } from 'react';
import { hiringService } from '../services/hiringService';
import { HiringProcess, HiringProcessFormData } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useHiring() {
    const [processes, setProcesses] = useState<HiringProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchProcesses = useCallback(async () => {
        try {
            setLoading(true);
            const entityId = activeEntityId === 'all' ? undefined : activeEntityId;
            const data = await hiringService.getProcesses(entityId || undefined);
            setProcesses(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching hiring processes:', JSON.stringify(err, null, 2), err);
            setError(err.message || err.error_description || 'Error al cargar procesos de contratación');
        } finally {
            setLoading(false);
        }
    }, [activeEntityId]);

    useEffect(() => {
        fetchProcesses();
    }, [fetchProcesses]);

    const createProcess = async (data: HiringProcessFormData) => {
        try {
            const newProcess = await hiringService.createProcess(data);
            setProcesses(prev => [newProcess, ...prev]);
            return newProcess;
        } catch (err: any) {
            console.error('Error creating process:', JSON.stringify(err, null, 2), err);
            throw err;
        }
    };

    const updateProcess = async (id: string, data: Partial<HiringProcessFormData>) => {
        try {
            const updated = await hiringService.updateProcess(id, data);
            setProcesses(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err: any) {
            console.error('Error updating process:', JSON.stringify(err, null, 2), err);
            throw err;
        }
    };

    const updatePhase = async (processId: string, phaseCode: string, completed: boolean) => {
        try {
            await hiringService.updatePhaseStatus(processId, phaseCode, completed);
            // Refresh the specific process to get new total_progress
            const updated = await hiringService.getProcessById(processId);
            setProcesses(prev => prev.map(p => p.id === processId ? updated : p));
        } catch (err: any) {
            console.error('Error updating phase:', JSON.stringify(err, null, 2), err);
            throw err;
        }
    };

    const deleteProcess = async (id: string) => {
        try {
            await hiringService.deleteProcess(id);
            setProcesses(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting process:', JSON.stringify(err, null, 2), err);
            throw err;
        }
    };

    return {
        processes,
        loading,
        error,
        refresh: fetchProcesses,
        createProcess,
        updateProcess,
        updatePhase,
        deleteProcess,
    };
}
