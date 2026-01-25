import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { entityService } from '@/features/entities/services/entityService';
import { ProjectData, ReportFilter, ReportStats } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useReports() {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [trendData, setTrendData] = useState<{ month: string, amount: number }[]>([]);
    const [activeBudget, setActiveBudget] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchProjects = useCallback(async () => {
        try {
            const [projData] = await Promise.all([
                reportService.getProjectsForFilter(activeEntityId)
            ]);

            setProjects(projData);
            setTrendData([]); // No financial data anymore
            setActiveBudget(0); // No budget data anymore

        } catch (error) {
            console.error('Error fetching report data:', error);
        }
    }, [activeEntityId]);

    const generateStats = async (filter: Omit<ReportFilter, 'entity_id'>) => {
        try {
            setLoading(true);
            const data = await reportService.getReportStats({
                ...filter,
                entity_id: activeEntityId
            });
            setStats(data);
            return data;
        } catch (error) {
            console.error('Error generating report stats:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return {
        projects,
        stats,
        trendData,
        loading,
        generateStats,
        activeEntityId,
        getExhaustionEstimate: () => null // Feature disabled due to financial module removal
    };
}
