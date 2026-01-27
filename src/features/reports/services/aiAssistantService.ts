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
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    actionCards?: ActionCard[];
}

export interface ActionCard {
    id: string;
    type: 'alert' | 'action' | 'insight';
    title: string;
    description: string;
    actionLabel: string;
    priority: 'high' | 'medium' | 'low';
}

export interface AIHistoryEntry {
    id: string;
    query: string;
    response: string;
    created_at: string;
}

export interface StrategicState {
    healthScore: number; // 0-100
    globalRisk: 'low' | 'medium' | 'high' | 'critical';
    keyRisks: string[];
    opportunities: string[];
    topActions: ActionCard[];
}

export const aiAssistantService = {
    /**
     * Motor de Heurística Avanzada (Virtual PM)
     * Analiza el estado estratégico del proyecto
     */
    analyzeStrategicState(stats: ReportStats | null): StrategicState {
        if (!stats) return {
            healthScore: 0,
            globalRisk: 'medium',
            keyRisks: ['No hay datos suficientes para el análisis'],
            opportunities: [],
            topActions: []
        };

        const risks: string[] = [];
        const opportunities: string[] = [];
        const actions: ActionCard[] = [];
        let healthScore = 100;

        // 1. Análisis de Salud Operativa (Velocity & Risks)
        const pendingCritical = Object.entries(stats.tasks_by_priority || {})
            .find(([p]) => p === 'Urgente')?.[1] || 0;

        const completionRate = stats.total_tasks > 0
            ? (stats.completed_tasks / stats.total_tasks) * 100
            : 0;

        if (pendingCritical > 3) {
            healthScore -= 20;
            risks.push(`${pendingCritical} Tareas Urgentes pendientes de cierre.`);
            actions.push({
                id: 'critical-tasks',
                type: 'alert',
                title: 'Bloqueo Crítico',
                description: 'Hay demasiadas tareas urgentes acumuladas.',
                actionLabel: 'Ver Tareas Urgentes',
                priority: 'high'
            });
        }

        if (completionRate < 30 && stats.total_tasks > 10) {
            healthScore -= 15;
            risks.push('Velocidad de ejecución por debajo del umbral esperado (<30%).');
            opportunities.push('Simplificar alcance de hitos próximos.');
        }

        // 2. Análisis de Capital Humano (Burnout & Efficiency)
        const overloadedMembers = stats.team_efficacy?.filter(m => m.load > 8) || [];
        const atRiskMembers = stats.team_efficacy?.filter(m => m.predicted_delay_risk > 70) || [];

        if (overloadedMembers.length > 0) {
            healthScore -= (overloadedMembers.length * 5);
            risks.push(`${overloadedMembers.length} miembros del equipo con riesgo de Burnout (>8 tareas activas).`);
            actions.push({
                id: 'reassign-load',
                type: 'action',
                title: 'Sobrecarga de Equipo',
                description: `Usuarios como ${overloadedMembers[0].full_name} tienen excesiva carga.`,
                actionLabel: 'Redistribuir Carga',
                priority: 'high'
            });
        }

        if (atRiskMembers.length > 0) {
            risks.push(`Detectada tendencia de retraso en ${atRiskMembers.length} colaboradores.`);
        }

        // 3. Oportunidades
        if (healthScore > 80) {
            opportunities.push('El equipo opera con alta eficiencia. Buen momento para adelantar Backlog.');
        }

        // Determinar Riesgo Global
        let globalRisk: StrategicState['globalRisk'] = 'low';
        if (healthScore < 60) globalRisk = 'critical';
        else if (healthScore < 80) globalRisk = 'high';
        else if (healthScore < 90) globalRisk = 'medium';

        return {
            healthScore: Math.max(0, healthScore),
            globalRisk,
            keyRisks: risks,
            opportunities,
            topActions: actions
        };
    },

    /**
     * Analiza los datos de reportes y genera insights ejecutivos
     */
    async analyzeReport(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        const { query, stats, entityName } = request;

        // Run the Virtual PM Engine first
        const strategicState = this.analyzeStrategicState(stats);
        const queryLower = query.toLowerCase();

        // Detect "Morning Briefing" intent (empty query or specific greeting)
        if (!query.trim() || queryLower.includes('estado') || queryLower.includes('resumen') || queryLower.includes('informe')) {
            return this.generateMorningBriefing(strategicState, entityName || 'Proyecto');
        }

        // Context-aware prompt generation based on strategic state
        return this.generateGenerativeResponse(query, strategicState, stats);
    },

    generateMorningBriefing(state: StrategicState, entityName: string): AIAnalysisResponse {
        const riskEmoji = state.globalRisk === 'critical' ? '🔴' : state.globalRisk === 'high' ? '🟠' : state.globalRisk === 'medium' ? '🟡' : '🟢';

        let response = `👋 **Morning Briefing: ${entityName}**\n\n`;
        response += `Estado de Salud: ${riskEmoji} **${state.healthScore}/100**\n\n`;

        if (state.keyRisks.length > 0) {
            response += `🔻 **Riesgos Detectados:**\n`;
            state.keyRisks.slice(0, 3).forEach(risk => response += `• ${risk}\n`);
            response += '\n';
        }

        if (state.opportunities.length > 0) {
            response += `💡 **Oportunidades:**\n`;
            state.opportunities.slice(0, 2).forEach(opp => response += `• ${opp}\n`);
        }

        return {
            response,
            suggestions: ['Ver detalle de riesgos', 'Analizar carga de trabajo', 'Ver proyección financiera'],
            riskLevel: state.globalRisk,
            actionCards: state.topActions
        };
    },

    async generateGenerativeResponse(query: string, state: StrategicState, stats: ReportStats | null): Promise<AIAnalysisResponse> {
        // This is a simplified logic. In a real LLM integration, this would send the 
        // StrategicState as context to the LLM.

        let response = '';
        const suggestions: string[] = [];

        if (query.includes('equipo') || query.includes('carga')) {
            if (stats?.team_efficacy) {
                const top = stats.team_efficacy.reduce((prev, current) => (prev.efficacy > current.efficacy) ? prev : current);
                response = `👥 **Análisis de Capital Humano**\n\n`;
                response += `El equipo opera con una salud de ${state.healthScore} puntos. `;
                response += `Destaca **${top.full_name}** con una eficacia del ${top.efficacy}%.\n\n`;

                const overloaded = stats.team_efficacy.filter(m => m.load > 8);
                if (overloaded.length > 0) {
                    response += `⚠️ **Atención:** ${overloaded.map(m => m.full_name).join(', ')} presentan sobrecarga de trabajo.`;
                } else {
                    response += `✅ La carga de trabajo está equilibrada correctamente.`;
                }
            }
        } else {
            response = `🤖 **Project Manager Virtual**\n\n`;
            response += `He analizado tu consulta sobre "${query}". `;
            if (state.globalRisk === 'critical' || state.globalRisk === 'high') {
                response += `Sin embargo, mi prioridad es alertarte sobre los **${state.keyRisks.length} riesgos críticos** detectados. Te sugiero revisarlos primero.`;
            } else {
                response += `El proyecto marcha bien (${state.healthScore}/100). Estadísticamente, tenemos un ${stats?.avg_progress}% de avance global.`;
            }
        }

        return {
            response,
            suggestions: ['Ver métricas financieras', 'Estado de contratación', 'Volver al resumen'],
            riskLevel: state.globalRisk,
            // Keep action cards relevant
            actionCards: state.topActions
        };
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
