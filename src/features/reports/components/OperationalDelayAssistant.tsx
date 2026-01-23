'use client';

import {
    Clock,
    AlertTriangle,
    TrendingUp,
    Users,
    Zap,
    Layout
} from 'lucide-react';
import { TeamEfficacyMember } from '../types';

interface Props {
    teamEfficacy: TeamEfficacyMember[];
}

export function OperationalDelayAssistant({ teamEfficacy }: Props) {
    const riskProfiles = teamEfficacy
        .filter(m => m.predicted_delay_risk > 1 || m.load > 8)
        .sort((a, b) => b.predicted_delay_risk - a.predicted_delay_risk);

    if (riskProfiles.length === 0) return null;

    return (
        <div className="p-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 relative overflow-hidden group">
            {/* Background Decoration */}
            <Clock className="absolute -right-8 -top-8 w-40 h-40 text-amber-500/5 transition-transform duration-700 group-hover:scale-110" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">IA de Proyección Operativa</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Análisis de Desviación por Carga y Mora</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {riskProfiles.map((member, i) => (
                        <div key={i} className="glass-card p-6 border-white/20 bg-white/40 dark:bg-slate-900/40 hover:translate-x-1 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{member.full_name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Layout className="w-3 h-3 text-primary" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{member.load} Tareas Activas</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mora Histórica</p>
                                        <p className="text-lg font-black text-amber-600">+{member.historical_avg_delay} d</p>
                                    </div>

                                    <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700" />

                                    <div className="text-center relative">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Riesgo Proyectado</p>
                                        <div className="flex items-center gap-2 justify-center">
                                            <TrendingUp className="w-4 h-4 text-rose-500" />
                                            <p className="text-lg font-black text-rose-500">+{member.predicted_delay_risk} d</p>
                                        </div>
                                        {member.predicted_delay_risk > member.historical_avg_delay && (
                                            <span className="absolute -top-1 -right-4 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100/50 dark:border-slate-800/50">
                                <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">
                                    *La IA proyecta una desviación adicional del {Math.round(((member.predicted_delay_risk / (member.historical_avg_delay || 1)) - 1) * 100)}% basada en la saturación actual del colaborador.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
