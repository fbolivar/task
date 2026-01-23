import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
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
            border: 'border-emerald-500/20'
        },
        {
            label: 'Gastos Ejecutivos',
            value: `$${summary.total_expenses.toLocaleString()}`,
            icon: TrendingDown,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
        {
            label: 'Utilidad Neta',
            value: `$${summary.net_profit.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Margen Rentabilidad',
            value: `${summary.profit_margin.toFixed(1)}%`,
            icon: PieChart,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
        }
    ];

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={i}
                            className={`glass-card p-6 flex items-center justify-between border-b-2 ${stat.border} hover:-translate-y-1 transition-all duration-300`}
                        >
                            <div>
                                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                                <h3 className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {summary.budget_execution > 0 && (
                <div className="glass-card p-6 mt-6 border-b-4 border-primary/20 animate-in slide-in-from-top-2 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" /> Ejecución Presupuestaria del Trimestre
                            </h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Comparativa de gasto real vs planeación fiscal</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-xl font-black ${summary.budget_execution >= 90 ? 'text-rose-500 animate-pulse' : 'text-primary'}`}>
                                {summary.budget_execution.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${summary.budget_execution >= 90 ? 'bg-rose-500' : 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`}
                            style={{ width: `${Math.min(summary.budget_execution, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between mt-3 text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                        <span>Gasto Real: ${summary.total_expenses.toLocaleString()}</span>
                        <span>Meta Fiscal Máxima</span>
                    </div>
                </div>
            )}
        </>
    );
}
