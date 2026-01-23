'use client';

import { useReports } from '@/features/reports/hooks/useReports';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { ReportGenerator } from '@/features/reports/components/ReportGenerator';
import { generateExecutivePDF } from '@/features/reports/utils/pdfGenerator';
import { ExpenseTrendChart } from '@/features/reports/components/ExpenseTrendChart';
import { ProjectionAssistant } from '@/features/reports/components/ProjectionAssistant';
import { NonComplianceReport } from '@/features/reports/components/NonComplianceReport';
import { OperationalDelayAssistant } from '@/features/reports/components/OperationalDelayAssistant';
import { AIExecutiveAssistant } from '@/features/reports/components/AIExecutiveAssistant';
import {
    FileText,
    Zap,
    ArrowUpRight,
    TrendingUp,
    ShieldCheck,
    PieChart as PieIcon
} from 'lucide-react';

export default function ReportesPage() {
    const { projects, stats, trendData, loading, generateStats, getExhaustionEstimate } = useReports();

    const handleGenerate = async (projectId: string, start: string, end: string) => {
        const resultStats = await generateStats({
            project_id: projectId,
            start_date: start,
            end_date: end
        });

        const projectName = projectId === 'all'
            ? 'Todos los proyectos'
            : projects.find(p => p.id === projectId)?.name || 'Proyecto';

        generateExecutivePDF(resultStats, projectName, start, end);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
            <ReportHeader />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <QuickStatCard
                    title="Cumplimiento Global"
                    value="84%"
                    trend="+5.2%"
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="emerald"
                />
                <QuickStatCard
                    title="Proyectos en Riesgo"
                    value="2"
                    trend="-1"
                    icon={<Zap className="w-5 h-5" />}
                    color="amber"
                />
                <QuickStatCard
                    title="Auditados este Mes"
                    value="12"
                    trend="+3"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    color="blue"
                />
            </div>

            <section className="animate-in slide-in-from-bottom duration-700 space-y-8">
                <ProjectionAssistant projection={getExhaustionEstimate()} />
                <OperationalDelayAssistant teamEfficacy={stats?.team_efficacy || []} />
                <NonComplianceReport stats={stats} />
            </section>

            {/* AI Executive Assistant */}
            <section className="animate-in slide-in-from-bottom duration-900">
                <AIExecutiveAssistant
                    stats={stats}
                    entityName="Ecosistema BC FABRIC"
                    trendData={trendData}
                />
            </section>

            <section className="animate-in slide-in-from-bottom duration-1000">
                <ExpenseTrendChart data={trendData} />
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                        Generador Avanzado
                        <span className="h-1 w-1 rounded-full bg-primary" />
                    </h2>
                </div>
                <ReportGenerator
                    projects={projects}
                    onGenerate={handleGenerate}
                    stats={stats}
                    loading={loading}
                />
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                        Plantillas Predefinidas
                        <span className="h-1 w-1 rounded-full bg-primary" />
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <TemplateCard
                        title="Auditoría de Cumplimiento"
                        description="Reporte detallado de hitos vs entregables finales."
                        icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
                        tag="Compliance"
                    />
                    <TemplateCard
                        title="Rentabilidad de Recursos"
                        description="Análisis de horas hombre invertidas por proyecto."
                        icon={<PieIcon className="w-6 h-6 text-blue-500" />}
                        tag="Financial"
                    />
                    <TemplateCard
                        title="Métricas de Equipo"
                        description="Eficacia individual y carga operativa por colaborador."
                        icon={<FileText className="w-6 h-6 text-purple-500" />}
                        tag="Human Capital"
                    />
                </div>
            </section>
        </div>
    );
}

interface QuickStatCardProps {
    title: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    color: 'emerald' | 'amber' | 'blue';
}

function QuickStatCard({ title, value, trend, icon, color }: QuickStatCardProps) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <div className="glass-card p-6 border-b-2 hover:translate-y-[-4px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {trend} {trend.startsWith('+') ? '↑' : '↓'}
                </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <h3 className="text-3xl font-black text-foreground mt-1">{value}</h3>
        </div>
    );
}

interface TemplateCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
}

function TemplateCard({ title, description, icon, tag }: TemplateCardProps) {
    return (
        <div className="glass-card p-6 group hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-150 group-hover:opacity-20 transition-all duration-700">
                {icon}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl w-fit mb-4 group-hover:bg-primary/10 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{tag}</span>
            <h4 className="text-lg font-black text-foreground mt-1 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{description}</p>

            <button className="mt-6 flex items-center gap-2 text-xs font-black text-primary hover:gap-3 transition-all">
                Configurar Reporte <ArrowUpRight className="w-3 h-3" />
            </button>
        </div>
    );
}
