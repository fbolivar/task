'use client';

import {
    ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BurndownPoint } from '../../types';

interface Props {
    data: BurndownPoint[];
    title?: string;
}

import { useState, useEffect } from 'react';

export function BurndownChart({ data, title = "Progreso de Ejecución (Burndown)" }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="glass-card p-6 h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800" />;

    if (!data || data.length === 0) {
        return (
            <div className="glass-card p-6 h-[400px] w-full flex flex-col items-center justify-center text-slate-400">
                <p>No hay datos suficientes para mostrar la gráfica.</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 h-[400px] w-full min-w-[300px] flex flex-col">
            <h3 className="text-lg font-black text-foreground mb-4 shrink-0">{title}</h3>
            <div className="w-full h-[300px] relative">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="day"
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fontWeight: 700 }}
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            {/* Guideline: Ideal Burndown */}
                            <Line
                                type="monotone"
                                dataKey="ideal"
                                name="Ritmo Ideal"
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                dot={false}
                            />

                            {/* Actual Progress */}
                            <Area
                                type="monotone"
                                dataKey="actual"
                                name="Trabajo Restante"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorActual)"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
