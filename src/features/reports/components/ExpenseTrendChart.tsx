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
        <div className="glass-card p-8 border-b-4 border-rose-500/20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{title}</h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Análisis de salida de capital por mes</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-rose-500">Live Analytics</span>
                </div>
            </div>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontWeight: 900 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#888', fontSize: 10, fontWeight: 900 }}
                            tickFormatter={(value) => `$${(value / 1000)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #ffffff10',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '900',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#f43f5e' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#f43f5e"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorExpense)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
