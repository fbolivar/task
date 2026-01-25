import { useEffect } from 'react';
import { useReports } from '@/features/reports/hooks/useReports';
import { notificationService } from '@/features/notifications/services/notificationService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { taskService } from '@/features/tasks/services/taskService';
import { thresholdService } from '@/features/entities/services/thresholdService';

export function useRiskMonitor() {
    const { getExhaustionEstimate, activeEntityId } = useReports();
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        if (!user || activeEntityId === 'all') return;

        const checkRisks = async () => {
            // 0. Fetch Custom Thresholds
            const thresholds = await thresholdService.getThresholds(activeEntityId);

            // 1. Financial Risk Check - DISABLED (Module Removed)
            // Code removed to prevent build errors with deleted financial module

            // 2. Operational Risk Check (Overdue Tasks & Auto-Reassign)
            if (thresholds?.task_risk_check_enabled !== false) {
                const overdueTasks = await taskService.getOverdueHighPriorityTasks(activeEntityId);

                if (overdueTasks.length > 0) {
                    // Notify about overdue critical tasks
                    await notificationService.createNotification({
                        user_id: user.id,
                        title: `🚨 ${overdueTasks.length} Tareas Críticas Vencidas`,
                        message: `Se han detectado hitos de alta prioridad fuera de plazo.`,
                        type: 'ERROR',
                        link: '/tareas'
                    });

                    // 2.1 Handle Auto-Reassignment
                    if (thresholds?.auto_reassign_enabled && thresholds.backup_assignee_id) {
                        const graceDays = thresholds.reassign_after_days || 3;
                        const now = new Date();

                        const tasksToReassign = overdueTasks.filter(t => {
                            if (!t.end_date) return false;
                            const dueDate = new Date(t.end_date);
                            const diffTime = Math.abs(now.getTime() - dueDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays > graceDays;
                        });

                        if (tasksToReassign.length > 0) {
                            const taskIds = tasksToReassign.map(t => t.id);
                            await taskService.reassignTasks(
                                taskIds,
                                thresholds.backup_assignee_id,
                                `Re-asignación automática: Superó umbral de ${graceDays} días de mora.`
                            );

                            await notificationService.createNotification({
                                user_id: user.id,
                                title: '⚡ Re-asignación Automática Ejecutada',
                                message: `Se han re-asignado ${tasksToReassign.length} tareas críticas al responsable de respaldo por mora excesiva.`,
                                type: 'SUCCESS',
                                link: '/tareas'
                            });
                        }
                    }
                }
            }
        };

        // Delay check to ensure data is loaded and avoid notification spam
        const timer = setTimeout(checkRisks, 5000);
        return () => clearTimeout(timer);
    }, [user, activeEntityId, getExhaustionEstimate]);
}
