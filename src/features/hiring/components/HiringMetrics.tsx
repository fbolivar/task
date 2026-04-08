'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { HIRING_PHASES } from '../types';

interface PhaseMetric {
    phase_code: string;
    phase_name: string;
    avg_days: number;
    completed_count: number;
}

interface RawTracking {
    phase_code: string;
    completed_at: string;
    created_at: string;
}

export function HiringMetrics() {
    const [metrics, setMetrics] = useState<PhaseMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [maxDays, setMaxDays] = useState(1);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('hiring_phases_tracking')
                    .select('phase_code, completed_at, created_at')
                    .eq('is_completed', true)
                    .not('completed_at', 'is', null);

                if (error) throw error;

                // Group by phase_code and compute average days
                const grouped: Record<string, number[]> = {};
                (data as RawTracking[]).forEach((row) => {
                    const created = new Date(row.created_at).getTime();
                    const completed = new Date(row.completed_at).getTime();
                    const days = Math.max(0, Math.round((completed - created) / (1000 * 60 * 60 * 24)));
                    if (!grouped[row.phase_code]) grouped[row.phase_code] = [];
                    grouped[row.phase_code].push(days);
                });

                const computed: PhaseMetric[] = HIRING_PHASES.map((phase) => {
                    const values = grouped[phase.code] ?? [];
                    const avg = values.length > 0
                        ? Math.round(values.reduce((s, v) => s + v, 0) / values.length)
                        : 0;
                    return {
                        phase_code: phase.code,
                        phase_name: phase.name,
                        avg_days: avg,
                        completed_count: values.length,
                    };
                });

                const max = computed.reduce((m, p) => Math.max(m, p.avg_days), 1);
                setMaxDays(max);
                setMetrics(computed);
            } catch (err) {
                console.error('Error fetching phase metrics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 p-6 flex items-center justify-center min-h-[120px]">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
        );
    }

    const hasData = metrics.some((m) => m.completed_count > 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground leading-none mb-0.5">
                        Benchmarking de Fases
                    </p>
                    <p className="text-sm font-black text-foreground leading-none">
                        Promedio de días por etapa
                    </p>
                </div>
                {hasData && (
                    <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Datos históricos
                    </div>
                )}
            </div>

            {!hasData ? (
                <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground font-medium">
                        Sin datos históricos de fases completadas aún.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
                    {metrics.map((metric) => {
                        const pct = maxDays > 0 ? Math.round((metric.avg_days / maxDays) * 100) : 0;
                        const hasMetric = metric.completed_count > 0;

                        return (
                            <div key={metric.phase_code} className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-tight text-foreground truncate leading-none">
                                        {metric.phase_name}
                                    </p>
                                    <span className={`text-[10px] font-black tabular-nums flex-shrink-0 ${hasMetric ? 'text-primary' : 'text-muted-foreground/40'}`}>
                                        {hasMetric ? `${metric.avg_days}d` : '--'}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-700"
                                        style={{ width: hasMetric ? `${pct}%` : '0%' }}
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground/60 font-bold leading-none">
                                    {hasMetric ? `${metric.completed_count} proceso${metric.completed_count !== 1 ? 's' : ''}` : 'Sin datos'}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
