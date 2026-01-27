'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface Props {
    data: { name: string; value: number }[];
    title: string;
}

export function PriorityChart({ data, title }: Props) {
    const { t } = useSettings();

    // Ensure we have data to avoid crash
    if (!data || data.length === 0) {
        return (
            <div className="glass-card p-6 h-[400px] w-full flex flex-col items-center justify-center text-slate-400">
                <p>No hay datos de prioridades.</p>
            </div>
        );
    }

    const COLORS = {
        'Alta': '#ef4444',   // Red-500
        'Media': '#f59e0b',  // Amber-500
        'Baja': '#3b82f6',   // Blue-500
        'Sin Prioridad': '#94a3b8' // Slate-400
    };

    const formattedData = data.map(d => ({
        ...d,
        color: COLORS[d.name as keyof typeof COLORS] || '#94a3b8'
    }));

    return (
        <div className="glass-card p-6 h-[400px] w-full min-w-[300px] flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-foreground/80 flex items-center gap-2">
                {title}
            </h3>

            <div className="flex-1 w-full relative">
                <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={formattedData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
