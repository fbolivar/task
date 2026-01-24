'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Sparkles } from 'lucide-react';

interface DataPoint {
    month: string;
    amount: number;
}

interface Props {
    data: DataPoint[];
    title?: string;
}

export function ExpenseTrendChart({ data, title = "Tendencia Anual de Gastos" }: Props) {
    return (
        <div className="card-premium p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-rose-500/70">Capital Flow monitor</span>
                    </div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{title}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">Análisis estratégico de salida de capital por periodo mensual</p>
                </div>
                <div className="flex items-center gap-3 bg-rose-500/10 px-4 py-2 rounded-2xl border border-rose-500/20 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-[0.1em]">Live Analytical Sync</span>
                </div>
            </div>

            <div className="h-[380px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontWeight: 900 }}
                            dy={15}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontWeight: 900 }}
                            tickFormatter={(value) => `$${(value / 1000)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: '900',
                                color: '#fff',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
                            }}
                            cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }}
                            itemStyle={{ color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#f43f5e"
                            strokeWidth={5}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            animationDuration={2500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Real Expenses</span>
                </div>
            </div>
        </div>
    );
}
