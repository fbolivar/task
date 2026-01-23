'use client';

import {
    AlertCircle,
    TrendingDown,
    Users,
    ChevronRight,
    ArrowUpRight,
    Search,
    ShieldAlert,
    Clock
} from 'lucide-react';
import { ReportStats } from '../types';

interface Props {
    stats: ReportStats | null;
}

export function NonComplianceReport({ stats }: Props) {
    if (!stats || !stats.team_efficacy) return null;

    // Filter collaborators with any critical overdue task or low efficacy
    const highRiskCollaborators = stats.team_efficacy
        .filter(m => m.overdue_critical > 0 || m.efficacy < 40)
        .sort((a, b) => b.overdue_critical - a.overdue_critical);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                        Auditoría de Incumplimientos
                        <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    </h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Análisis de Desviaciones Críticas Vencidas</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase">{highRiskCollaborators.length} Perfiles en Riesgo</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {highRiskCollaborators.length > 0 ? (
                    highRiskCollaborators.map((member, i) => (
                        <div key={i} className="glass-card p-6 border-l-4 border-l-rose-500 hover:translate-x-1 transition-all group">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground uppercase tracking-tight">{member.full_name}</h4>
                                        <p className="text-[10px] font-bold text-muted-foreground truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Hitos Críticos Vencidos</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-rose-500">{member.overdue_critical}</span>
                                            <AlertCircle className="w-4 h-4 text-rose-500/50" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Eficacia General</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xl font-black ${member.efficacy < 50 ? 'text-rose-500' : 'text-amber-500'}`}>{member.efficacy}%</span>
                                            <TrendingDown className="w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Carga Activa</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-foreground">{member.load}</span>
                                            <Clock className="w-4 h-4 text-muted-foreground/50" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <button className="flex items-center gap-2 text-[10px] font-black text-primary hover:gap-3 transition-all uppercase tracking-widest">
                                            Intervenir <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Potential Impact Bar */}
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase">Impacto Operativo Proyectado</span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase">Estado Crítico</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-rose-500 to-primary transition-all duration-1000"
                                        style={{ width: `${Math.min((member.overdue_critical / 5) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">No se detectan incumplimientos críticos en el ecosistema actual.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
    )
}
