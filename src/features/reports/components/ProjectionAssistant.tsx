'use client';

import {
    BrainCircuit,
    AlertTriangle,
    ShieldCheck,
    Timer,
    Zap,
    TrendingDown,
    Calendar
} from 'lucide-react';

interface ProjectionData {
    status: 'EXHAUSTED' | 'CRITICAL' | 'WARNING' | 'SAFE';
    month: string;
    avgBurn: number;
    remaining: number;
    totalBudget: number;
}

interface Props {
    projection: ProjectionData | null;
}

export function ProjectionAssistant({ projection }: Props) {
    if (!projection) return null;

    const statusConfig = {
        EXHAUSTED: {
            icon: AlertTriangle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            label: 'Presupuesto Agotado',
            description: 'Se ha superado el límite de inversión planificado para el trimestre.'
        },
        CRITICAL: {
            icon: Zap,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            label: 'Riesgo de Insolvencia',
            description: 'El presupuesto actual se agotará en menos de 30 días.'
        },
        WARNING: {
            icon: Timer,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            label: 'Alerta de Consumo',
            description: 'El ritmo de gasto actual sugiere agotamiento en los próximos 60 días.'
        },
        SAFE: {
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            label: 'Ecosistema Estable',
            description: 'La tasa de consumo es coherente con el presupuesto planificado.'
        }
    };

    const config = statusConfig[projection.status];
    const Icon = config.icon;

    return (
        <div className={`p-8 rounded-3xl border ${config.border} ${config.bg} relative overflow-hidden group`}>
            {/* Background Icon Decoration */}
            <BrainCircuit className="absolute -right-8 -bottom-8 w-48 h-48 text-primary/5 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-3 rounded-2xl ${config.bg} ${config.color} shadow-lg ring-4 ring-white/5`}>
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">AI Projection Assistant</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Análisis Predictivo de Liquidez</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Icon className={`w-5 h-5 ${config.color}`} />
                                <span className={`text-sm font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">{config.description}</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Estimado Agotamiento</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <span className="text-lg font-black text-foreground uppercase">{projection.month}</span>
                                </div>
                            </div>
                            <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700" />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Calculado Burn Rate</p>
                                <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-rose-500" />
                                    <span className="text-lg font-black text-foreground">${Math.round(projection.avgBurn).toLocaleString()}/mes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6 bg-white/40 dark:bg-slate-900/40 border-white/20">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Estado Fiscal Q</span>
                                <span className="text-[10px] font-black uppercase text-primary">${projection.remaining.toLocaleString()} restantes</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${config.bg.replace('/10', '')}`}
                                    style={{ width: `${Math.min((projection.remaining / projection.totalBudget) * 100, 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground italic text-center">
                                *Proyección basada en los últimos meses de actividad financiera.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
