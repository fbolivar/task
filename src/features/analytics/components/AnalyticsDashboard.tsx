'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AnalyticsDashboardData } from '../types';
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    Loader2, PieChart, BarChart3, TrendingUp, TrendingDown,
    Target, Zap, Activity, Users, DollarSign, Calendar, ShieldAlert
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

// --- Shared Components for this Module ---

function ChartWrapper({ children, className = "h-[300px] w-full" }: { children: React.ReactNode, className?: string }) {
    const [ready, setReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                if (offsetWidth > 0 && offsetHeight > 0) {
                    setReady(true);
                }
            }
        };

        const resizeObserver = new ResizeObserver((entries) => {
            requestAnimationFrame(() => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (width > 0 && height > 0) {
                        setReady(true);
                    }
                }
            });
        });

        // Check immediately
        updateDimensions();

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className={`${className} min-w-0 relative overflow-hidden`} ref={containerRef} style={{ width: '100%', height: '100%' }}>
            {ready ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={0}>
                    {children as any}
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, subtext, icon: Icon, trend, trendUp, colorClass = "text-primary", bgClass = "bg-primary/10" }: any) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                        }`}>
                        {trend}
                    </div>
                )}
            </div>
            <h3 className="text-3xl font-black text-foreground tracking-tighter mb-1">{value}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <p className="text-[10px] text-muted-foreground/60 font-medium">{subtext}</p>
        </div>
    );
}

export function AnalyticsDashboard() {
    const { activeEntityId } = useAuthStore();
    const [data, setData] = useState<AnalyticsDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await analyticsService.getDashboardData(activeEntityId);
                setData(res);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [activeEntityId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Procesando Inteligencia de Negocio...</p>
        </div>
    );

    if (!data) return null;

    const formatCurrency = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0, notation: 'compact' }).format(val);

    return (
        <div className="space-y-10 animate-reveal">

            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-10 min-h-[200px] flex flex-col justify-center">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Executive Insight v3.0
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                        Centro de Comando Estratégico
                    </h1>
                    <p className="text-slate-400 font-medium max-w-2xl text-lg">
                        Visión unificada de rendimiento financiero, eficiencia operativa y gestión de riesgo corporativo.
                    </p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Ejecución Presupuestal"
                    value={`${data.kpis.budget_execution_percentage.toFixed(1)}%`}
                    subtext={`Total: ${formatCurrency(data.kpis.total_budget)}`}
                    icon={DollarSign}
                    trend={data.kpis.budget_execution_percentage > 90 ? 'Crítico' : 'Nominal'}
                    trendUp={data.kpis.budget_execution_percentage <= 90}
                    colorClass="text-emerald-500"
                    bgClass="bg-emerald-500/10"
                />
                <StatCard
                    title="Eficiencia Operativa"
                    value={`${data.kpis.avg_task_completion.toFixed(1)}%`}
                    subtext={`${data.kpis.total_tasks} Tareas Totales`}
                    icon={Zap}
                    trend="+4.2%"
                    trendUp={true}
                    colorClass="text-amber-500"
                    bgClass="bg-amber-500/10"
                />
                <StatCard
                    title="Salud de Cartera"
                    value={data.kpis.active_projects_count}
                    subtext="Proyectos Activos"
                    icon={Activity}
                    trend={`${data.kpis.high_risk_projects_count} Riesgos`}
                    trendUp={data.kpis.high_risk_projects_count === 0}
                    colorClass="text-blue-500"
                    bgClass="bg-blue-500/10"
                />
                <StatCard
                    title="Talento en Pipeline"
                    value={data.kpis.active_hiring_processes}
                    subtext={`Est: ${formatCurrency(data.kpis.hiring_volume_estimated)}`}
                    icon={Users}
                    trend="Estable"
                    trendUp={null}
                    colorClass="text-purple-500"
                    bgClass="bg-purple-500/10"
                />
            </div>

            {/* Main Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[450px]">

                {/* Financial Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                Flujo de Capital
                            </h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Planeado vs Ejecutado (YTD)</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ChartWrapper>
                            <AreaChart data={data.financial_trend}>
                                <defs>
                                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'currentColor' }} className="text-muted-foreground" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="planned" stackId="1" stroke="#6366f1" fill="url(#colorPlanned)" strokeWidth={3} name="Presupuesto" />
                                <Area type="monotone" dataKey="actual" stackId="2" stroke="#10b981" fill="url(#colorActual)" strokeWidth={3} name="Ejecutado" />
                            </AreaChart>
                        </ChartWrapper>
                    </div>
                </div>

                {/* Efficiency Radial */}
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10 mb-6">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-400" />
                            Top Eficiencia
                        </h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Proyectos Líderes</p>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <ChartWrapper>
                            <RadialBarChart
                                innerRadius="30%"
                                outerRadius="100%"
                                data={data.task_efficiency}
                                startAngle={180}
                                endAngle={0}
                            >
                                <RadialBar
                                    label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                    background={{ fill: '#ffffff10' }}
                                    dataKey="efficiency"
                                    cornerRadius={10}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', color: 'white' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </RadialBarChart>
                        </ChartWrapper>
                        <div className="absolute bottom-0 left-0 w-full text-center pb-4">
                            <div className="text-4xl font-black tracking-tighter text-indigo-400">
                                {data.task_efficiency[0]?.efficiency.toFixed(0)}%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                                Eficiencia Máxima
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Risk Matrix */}
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Matriz de Riesgo</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Impacto vs Inversión</p>
                        </div>
                    </div>
                    <div className="space-y-5">
                        {data.risk_matrix.map((item) => (
                            <div key={item.risk_level} className="group">
                                <div className="flex justify-between text-xs font-black uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.risk_level === 'Alto' || item.risk_level === 'Crítico' ? 'bg-red-500' :
                                            item.risk_level === 'Medio' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                        {item.risk_level}
                                    </span>
                                    <span>{formatCurrency(item.total_budget)}</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 group-hover:opacity-80 ${item.risk_level === 'Alto' || item.risk_level === 'Crítico' ? 'bg-red-500' :
                                            item.risk_level === 'Medio' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${data.kpis.total_budget > 0 ? (item.total_budget / data.kpis.total_budget) * 100 : 0}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground font-medium">
                                    <span>{item.count} Proyectos</span>
                                    <span>{(data.kpis.total_budget > 0 ? (item.total_budget / data.kpis.total_budget) * 100 : 0).toFixed(1)}% del Capital</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hiring Pulse List */}
                <div className="stat-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Procesos de Contratación</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Procesos en Curso</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {data.recent_hiring_processes && data.recent_hiring_processes.length > 0 ? (
                            data.recent_hiring_processes.map((process, index) => (
                                <div key={process.id} className="group p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-1" title={process.title}>{process.title}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">{process.project_name}</p>
                                        </div>
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${process.status === 'En Proceso' ? 'bg-blue-500/10 text-blue-600' :
                                            process.status === 'Adjudicado' ? 'bg-emerald-500/10 text-emerald-600' :
                                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}>
                                            {process.status}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                            <span>Progreso</span>
                                            <span>{process.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 group-hover:bg-blue-600"
                                                style={{ width: `${process.progress}%` }}
                                            />
                                        </div>

                                        {/* Phases Stepper */}
                                        <div className="flex justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                            {(() => {
                                                // Simplified constant for visualization if not fully loaded, 
                                                // but we should have phases from the service now.
                                                // We use a fixed set of codes to map standard phases if the process object 
                                                // doesn't have them all populated yet, or iterate the phases array.
                                                const standardPhases = ['ficha_tecnica', 'estudio_mercado', 'cdp_vigencia', 'estudio_previo', 'radicacion_contratos', 'proceso_adjudicado', 'legalizacion_contrato'];

                                                return standardPhases.map((phaseCode, i) => {
                                                    const phase = process.phases?.find((p: any) => p.phase_code === phaseCode);
                                                    const isCompleted = phase?.is_completed;
                                                    const isNext = !isCompleted && (i === 0 || process.phases?.find((p: any) => p.phase_code === standardPhases[i - 1])?.is_completed);

                                                    return (
                                                        <div key={phaseCode} className="flex flex-col items-center gap-1 group/phase relative">
                                                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' :
                                                                isNext ? 'bg-blue-500 animate-pulse scale-125' :
                                                                    'bg-slate-200 dark:bg-slate-700'
                                                                }`}
                                                                title={phaseCode.replace(/_/g, ' ')}
                                                            />
                                                            {/* Connector Line */}
                                                            {i < standardPhases.length - 1 && (
                                                                <div className={`absolute top-1 left-3 w-[calc(100%+0.5rem)] h-[1px] -z-10 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                                                                    }`} />
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Users className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-muted-foreground">Sin procesos activos</p>
                            </div>
                        )}
                        <div className="pt-2 text-center">
                            <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-colors">
                                Ver Todos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
