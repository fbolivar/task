import { createClient } from '@/lib/supabase/client';
import { ReportStats } from '../types';

export interface AIAnalysisRequest {
    query: string;
    stats: ReportStats | null;
    entityName?: string;
    trendData?: { month: string; amount: number }[];
}

export interface AIAnalysisResponse {
    response: string;
    suggestions: string[];
    riskLevel: 'low' | 'medium' | 'high';
}

export interface AIHistoryEntry {
    id: string;
    query: string;
    response: string;
    created_at: string;
}

export const aiAssistantService = {
    /**
     * Analiza los datos de reportes y genera insights ejecutivos
     */
    async analyzeReport(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        const { query, stats, entityName, trendData } = request;

        // Build context from available data
        const context = this.buildContext(stats, entityName, trendData);

        // Generate AI response (simulated intelligent analysis)
        const response = this.generateExecutiveInsight(query, context);

        // Save to history
        await this.saveToHistory(query, response.response);

        return response;
    },

    buildContext(stats: ReportStats | null, entityName?: string, trendData?: { month: string; amount: number }[]) {
        const ctx: Record<string, any> = {};

        if (stats) {
            ctx.totalTasks = stats.total_tasks;
            ctx.completedTasks = stats.completed_tasks;
            ctx.pendingTasks = stats.pending_tasks;
            ctx.avgProgress = stats.avg_progress;
            ctx.completionRate = stats.total_tasks > 0
                ? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
                : 0;

            // Team analysis
            if (stats.team_efficacy?.length > 0) {
                const avgEfficacy = Math.round(
                    stats.team_efficacy.reduce((a, b) => a + b.efficacy, 0) / stats.team_efficacy.length
                );
                const overloadedMembers = stats.team_efficacy.filter(m => m.load > 8).length;
                const atRiskMembers = stats.team_efficacy.filter(m => m.overdue_critical > 0).length;

                ctx.avgTeamEfficacy = avgEfficacy;
                ctx.overloadedMembers = overloadedMembers;
                ctx.atRiskMembers = atRiskMembers;
                ctx.topPerformer = stats.team_efficacy.reduce((a, b) => a.efficacy > b.efficacy ? a : b);
            }
        }

        if (trendData?.length) {
            const totalSpent = trendData.reduce((a, b) => a + b.amount, 0);
            const avgMonthly = Math.round(totalSpent / trendData.length);
            ctx.totalSpent = totalSpent;
            ctx.avgMonthlySpend = avgMonthly;
            ctx.spendTrend = trendData;
        }

        ctx.entityName = entityName || 'Ecosistema Global';

        return ctx;
    },

    generateExecutiveInsight(query: string, context: Record<string, any>): AIAnalysisResponse {
        const queryLower = query.toLowerCase();
        let response = '';
        let suggestions: string[] = [];
        let riskLevel: 'low' | 'medium' | 'high' = 'low';

        // Análisis de rendimiento del equipo
        if (queryLower.includes('equipo') || queryLower.includes('rendimiento') || queryLower.includes('eficacia')) {
            const efficacy = context.avgTeamEfficacy || 0;
            const atRisk = context.atRiskMembers || 0;

            if (efficacy >= 80) {
                response = `📊 **Análisis de Rendimiento del Equipo**\n\nEl equipo de ${context.entityName} muestra un rendimiento **excepcional** con una eficacia promedio del ${efficacy}%. `;
                riskLevel = 'low';
            } else if (efficacy >= 60) {
                response = `📊 **Análisis de Rendimiento del Equipo**\n\nEl equipo mantiene un rendimiento **aceptable** con ${efficacy}% de eficacia. `;
                riskLevel = 'medium';
            } else {
                response = `⚠️ **Alerta de Rendimiento**\n\nDetecto una eficacia del ${efficacy}% que está por debajo del umbral óptimo. `;
                riskLevel = 'high';
            }

            if (atRisk > 0) {
                response += `\n\n🚨 **${atRisk} colaborador(es)** tienen tareas críticas vencidas. Recomiendo intervención inmediata.`;
                suggestions.push('Revisar cargas de trabajo de colaboradores en riesgo');
                suggestions.push('Activar protocolo de re-asignación automática');
            }

            if (context.topPerformer) {
                response += `\n\n⭐ **Top Performer**: ${context.topPerformer.full_name} con ${context.topPerformer.efficacy}% de eficacia.`;
            }

            suggestions.push('Programar reuniones 1:1 con colaboradores de bajo rendimiento');
        }
        // Análisis financiero
        else if (queryLower.includes('gasto') || queryLower.includes('presupuesto') || queryLower.includes('financ')) {
            const avgSpend = context.avgMonthlySpend || 0;
            const total = context.totalSpent || 0;

            response = `💰 **Análisis Financiero Ejecutivo**\n\nEl gasto acumulado es de **$${total.toLocaleString()}** con un promedio mensual de **$${avgSpend.toLocaleString()}**.\n\n`;

            if (avgSpend > 0) {
                const projection = avgSpend * 12;
                response += `📈 **Proyección Anual**: $${projection.toLocaleString()} basado en el ritmo actual de consumo.`;

                suggestions.push('Revisar partidas de mayor impacto');
                suggestions.push('Evaluar optimización de costos operativos');
            }

            riskLevel = avgSpend > 50000 ? 'high' : avgSpend > 20000 ? 'medium' : 'low';
        }
        // Análisis de tareas/proyectos
        else if (queryLower.includes('tarea') || queryLower.includes('proyecto') || queryLower.includes('progreso')) {
            const completion = context.completionRate || 0;
            const pending = context.pendingTasks || 0;

            response = `📋 **Estado de Operaciones**\n\n`;
            response += `✅ **Tasa de Completación**: ${completion}%\n`;
            response += `📊 **Progreso Promedio**: ${context.avgProgress || 0}%\n`;
            response += `⏳ **Tareas Pendientes**: ${pending}\n\n`;

            if (pending > 20) {
                response += `⚠️ Se detecta acumulación de tareas. Considere redistribuir cargas o priorizar hitos críticos.`;
                riskLevel = 'high';
                suggestions.push('Priorizar tareas de alto impacto');
                suggestions.push('Evaluar necesidad de recursos adicionales');
            } else if (pending > 10) {
                response += `📌 Carga de trabajo moderada. Monitorear para evitar cuellos de botella.`;
                riskLevel = 'medium';
            } else {
                response += `✨ Excelente gestión operativa. El flujo de trabajo está bajo control.`;
            }
        }
        // Resumen ejecutivo general
        else if (queryLower.includes('resumen') || queryLower.includes('general') || queryLower.includes('estado')) {
            response = `📊 **Resumen Ejecutivo - ${context.entityName}**\n\n`;
            response += `**Operaciones**\n`;
            response += `• ${context.totalTasks || 0} tareas totales | ${context.completedTasks || 0} completadas\n`;
            response += `• Progreso promedio: ${context.avgProgress || 0}%\n\n`;

            if (context.avgTeamEfficacy) {
                response += `**Capital Humano**\n`;
                response += `• Eficacia del equipo: ${context.avgTeamEfficacy}%\n`;
                response += `• ${context.overloadedMembers || 0} colaboradores con sobrecarga\n\n`;
            }

            if (context.totalSpent) {
                response += `**Finanzas**\n`;
                response += `• Gasto acumulado: $${context.totalSpent.toLocaleString()}\n`;
                response += `• Promedio mensual: $${(context.avgMonthlySpend || 0).toLocaleString()}\n`;
            }

            suggestions.push('Generar reporte PDF para distribución');
            suggestions.push('Programar revisión de KPIs semanalmente');
        }
        // Respuesta genérica inteligente
        else {
            response = `🤖 **Asistente Ejecutivo**\n\nEntiendo tu consulta sobre "${query}". `;
            response += `Basándome en los datos actuales de ${context.entityName}:\n\n`;
            response += `• **${context.completedTasks || 0}** tareas completadas de **${context.totalTasks || 0}** totales\n`;
            response += `• Eficacia del equipo: **${context.avgTeamEfficacy || 'N/A'}%**\n`;
            response += `\n¿Deseas que profundice en algún área específica como rendimiento del equipo, finanzas o estado de proyectos?`;

            suggestions.push('Pregunta sobre rendimiento del equipo');
            suggestions.push('Pregunta sobre análisis financiero');
            suggestions.push('Solicita un resumen ejecutivo');
        }

        return { response, suggestions, riskLevel };
    },

    async saveToHistory(query: string, response: string): Promise<void> {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        await supabase.from('ai_analysis_history').insert({
            user_id: user.id,
            query,
            response,
            context_type: 'report'
        });
    },

    async getHistory(limit: number = 10): Promise<AIHistoryEntry[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('ai_analysis_history')
            .select('id, query, response, created_at')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }
};
