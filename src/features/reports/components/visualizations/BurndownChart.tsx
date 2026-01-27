'use client';

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area
} from 'recharts';
import { BurndownPoint } from '../../types';

interface Props {
    data: BurndownPoint[];
    title?: string;
}

import { useState, useEffect } from 'react';

export function BurndownChart({ data, title = "Burndown de Proyecto" }: Props) {
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
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="day"
                                tick={{ fontSize: 10, fontWeight: 800 }}
                                stroke="#94a3b8"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fontWeight: 800 }}
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
                                formatter={(value: any) => [Number.isNaN(Number(value)) ? '0' : value, undefined]}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />

                            <Line
                                type="monotone"
                                dataKey="ideal"
                                stroke="#94a3b8"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                name="Progreso Ideal"
                                dot={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#f43f5e"
                                strokeWidth={3}
                                name="Progreso Real"
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />

                            <Line
                                type="monotone"
                                dataKey="remaining"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Trabajo Restante"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
