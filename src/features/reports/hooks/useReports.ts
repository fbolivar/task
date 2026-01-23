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
            const [projData, trend, entityData] = await Promise.all([
                reportService.getProjectsForFilter(activeEntityId),
                reportService.getExpenseTrend(activeEntityId),
                activeEntityId !== 'all' ? entityService.getEntityById(activeEntityId) : Promise.resolve(null)
            ]);

            setProjects(projData);
            setTrendData(trend);

            if (entityData) {
                const now = new Date();
                const quarter = Math.ceil((now.getMonth() + 1) / 3);
                const budget = (entityData as any)[`budget_q${quarter}`] || 0;
                setActiveBudget(budget);
            }
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
        getExhaustionEstimate: () => {
            if (activeBudget === 0 || trendData.length === 0) return null;

            // 1. Calculate average monthly burn from historical data
            const nonZeroMonths = trendData.filter(d => d.amount > 0);
            if (nonZeroMonths.length === 0) return null;

            const totalBurn = nonZeroMonths.reduce((sum, d) => sum + d.amount, 0);
            const avgMonthlyBurn = totalBurn / nonZeroMonths.length;

            // 2. Identify current quarter expenses (assuming last non-zero month is recent)
            // Or better, aggregate current quarter from trendData
            const now = new Date();
            const quarter = Math.ceil((now.getMonth() + 1) / 3);
            const qStartMonth = (quarter - 1) * 3 + 1;

            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const qMonths = monthNames.slice(qStartMonth - 1, qStartMonth + 2);

            const currentQExpenses = trendData
                .filter(d => qMonths.includes(d.month))
                .reduce((sum, d) => sum + d.amount, 0);

            const remainingBudget = activeBudget - currentQExpenses;

            if (remainingBudget <= 0) return {
                status: 'EXHAUSTED' as const,
                month: 'Inmediato',
                avgBurn: avgMonthlyBurn,
                remaining: 0,
                totalBudget: activeBudget
            };

            // 3. Estimate months remaining
            const monthsLeft = remainingBudget / avgMonthlyBurn;

            // 4. Calculate target month
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + Math.round(monthsLeft));

            const targetMonthName = monthNames[targetDate.getMonth()];

            const status = (monthsLeft < 1 ? 'CRITICAL' : monthsLeft < 2 ? 'WARNING' : 'SAFE') as 'CRITICAL' | 'WARNING' | 'SAFE';

            return {
                status,
                month: targetMonthName,
                avgBurn: avgMonthlyBurn,
                remaining: remainingBudget,
                totalBudget: activeBudget
            };
        }
    };
}
