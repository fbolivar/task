'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { ResourceMetric } from '../../types';

interface Props {
    data: ResourceMetric[];
    title?: string;
}

import { useState, useEffect } from 'react';

export function ResourceHeatmap({ data, title = "Mapa de Calor de Recursos" }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sort by load (allocation)
    const sortedData = [...data].sort((a, b) => b.allocation - a.allocation);

    const getBarColor = (allocation: number) => {
        if (allocation > 90) return '#f43f5e'; // Red - Overloaded
        if (allocation > 70) return '#fbbf24'; // Amber - High
        if (allocation < 40) return '#3b82f6'; // Blue - Underutilized
        return '#10b981'; // Green - Optimal
    };

    if (!mounted) return <div className="glass-card p-6 h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800" />;

    return (
        <div className="glass-card p-6 h-[400px] w-full flex flex-col">
            <h3 className="text-lg font-black text-foreground mb-4 shrink-0">{title}</h3>
            <div className="w-full h-[300px]" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11, fontWeight: 700 }}
                            stroke="#64748b"
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as ResourceMetric;
                                    return (
                                        <div className="bg-white/95 dark:bg-slate-900/95 p-3 shadow-lg rounded-xl border border-slate-100 dark:border-slate-800 backdrop-blur-sm">
                                            <p className="font-black text-sm mb-1">{data.name}</p>
                                            <p className="text-xs text-muted-foreground mb-2">{data.role}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4 text-xs">
                                                    <span>Carga:</span>
                                                    <span className="font-bold">{data.allocation}%</span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-xs">
                                                    <span>Eficacia:</span>
                                                    <span className={`font-bold ${data.efficiency_score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                        {data.efficiency_score}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4 text-xs">
                                                    <span>Tareas:</span>
                                                    <span className="font-bold">{data.tasks_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar dataKey="allocation" name="Carga de Trabajo" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.allocation)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
