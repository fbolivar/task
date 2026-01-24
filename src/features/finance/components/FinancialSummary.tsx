'use client';

import { TrendingUp, TrendingDown, DollarSign, PieChart, Sparkles } from 'lucide-react';
import { FinancialSummary as SummaryType } from '../types';

interface Props {
    summary: SummaryType;
}

export function FinancialSummary({ summary }: Props) {
    const stats = [
        {
            label: 'Ingresos Totales',
            value: `$${summary.total_income.toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            gradient: 'from-emerald-500/20 to-teal-500/20'
        },
        {
            label: 'Gastos Ejecutivos',
            value: `$${summary.total_expenses.toLocaleString()}`,
            icon: TrendingDown,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            gradient: 'from-rose-500/20 to-orange-500/20'
        },
        {
            label: 'Utilidad Neta',
            value: `$${summary.net_profit.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            gradient: 'from-blue-500/20 to-indigo-500/20'
        },
        {
            label: 'Margen Rentabilidad',
            value: `${summary.profit_margin.toFixed(1)}%`,
            icon: PieChart,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            gradient: 'from-purple-500/20 to-fuchsia-500/20'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="stat-card group hover:translate-y-[-8px] transition-all duration-500">
                            <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br ${stat.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                <div className={`p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 ${stat.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="p-1 px-3 bg-white/50 dark:bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-slate-100 dark:border-white/5">
                                    Live
                                </div>
                            </div>

                            <div className="relative z-10">
                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                <h3 className={`text-4xl font-black tracking-tighter transition-all group-hover:scale-105 origin-left ${stat.color}`}>{stat.value}</h3>
                            </div>

                            <div className={`h-1 w-0 bg-current absolute bottom-0 left-0 transition-all duration-700 group-hover:w-full ${stat.color}`} />
                        </div>
                    );
                })}
            </div>

            {summary.budget_execution > 0 && (
                <div className="card-premium p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Efficiency Report</span>
                                </div>
                                <h4 className="text-2xl font-black text-foreground tracking-tight">Ejecución Presupuestaria Trimestral</h4>
                                <p className="text-sm font-medium text-muted-foreground">Comparativa estratégica de gasto real versus planeación fiscal corporativa.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                    <span className={`text-3xl font-black tracking-tighter ${summary.budget_execution >= 90 ? 'text-rose-500' : 'text-primary'}`}>
                                        {summary.budget_execution.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="relative h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-1 shadow-inner">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-spring ${summary.budget_execution >= 90 ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-gradient-to-r from-primary to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]'}`}
                                style={{ width: `${Math.min(summary.budget_execution, 100)}%` }}
                            />
                        </div>

                        <div className="flex justify-between mt-5">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Gasto Ejecutado: <span className="text-foreground">${summary.total_expenses.toLocaleString()}</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Meta Corporativa: <span className="text-foreground">Optimal</span></span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
