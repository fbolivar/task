'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { FinancialMetric } from '../../types';

interface Props {
    data: FinancialMetric[];
    title?: string;
    currency?: string;
}

import { useState, useEffect } from 'react';

export function BudgetWaterfall({ data, title = "Flujo Financiero", currency = "$" }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Process data for waterfall chart
    let cumulative = 0;
    const waterfallData = data.map(item => {
        const start = cumulative;
        const value = item.type === 'expense' ? -item.amount : item.amount;
        cumulative += value;
        return {
            name: item.category,
            value: value,
            start: start,
            end: cumulative,
            fill: item.type === 'budget' ? '#3b82f6' : (item.type === 'income' ? '#10b981' : '#ef4444'),
            original: item
        };
    });

    // Add total column
    waterfallData.push({
        name: 'Total',
        value: cumulative,
        start: 0,
        end: cumulative,
        fill: cumulative >= 0 ? '#10b981' : '#ef4444',
        original: { category: 'Total', amount: Math.abs(cumulative), type: cumulative >= 0 ? 'income' : 'expense' }
    });

    if (!mounted) return <div className="glass-card p-6 h-[400px] w-full animate-pulse bg-slate-100 dark:bg-slate-800" />;

    if (!data || data.length === 0) {
        return (
            <div className="glass-card p-6 h-[400px] w-full flex flex-col items-center justify-center text-slate-400">
                <p>No hay datos financieros para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 h-[400px] w-full min-w-[300px] flex flex-col">
            <h3 className="text-lg font-black text-foreground mb-4 shrink-0">{title}</h3>
            <div className="w-full h-[300px] relative">
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={waterfallData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis
                                dataKey="name"
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
                                tickFormatter={(value) => `${currency}${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                }}
                                formatter={(value: any) => [`${currency}${Math.abs(Number(value) || 0).toLocaleString()}`, 'Monto']}
                            />
                            <Bar dataKey="start" stackId="a" fill="transparent" />
                            <Bar dataKey="value" stackId="a" radius={[4, 4, 4, 4]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
