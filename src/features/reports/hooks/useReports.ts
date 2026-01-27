import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { entityService } from '@/features/entities/services/entityService';
import { ProjectData, ReportFilter, ReportStats, BurndownPoint, ResourceMetric, FinancialMetric } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useReports() {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [stats, setStats] = useState<ReportStats | null>(null);

    // New state for visualizations
    const [loading, setLoading] = useState(false);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchProjects = useCallback(async () => {
        try {
            const [projData] = await Promise.all([
                reportService.getProjectsForFilter(activeEntityId)
            ]);

            setProjects(projData);
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
            return; // Return void explicitly 
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
        trendData: stats?.trend_data || [],
        // Fallback to empty defaults if stats is null to avoid breakages before generation
        burndownData: stats?.burndown_data || [],
        resourceData: stats?.resource_metrics || [],
        financialData: stats?.financial_metrics || [],
        loading,
        generateStats,
        activeEntityId,
        getExhaustionEstimate: () => null
    };
}
