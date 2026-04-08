'use client';

import { Activity, AlertCircle, AlertTriangle, LogIn } from 'lucide-react';
import { SecurityLog } from './types';

interface SecurityStatsCardsProps {
    totalCount: number;
    logs: SecurityLog[];
}

export function SecurityStatsCards({ totalCount, logs }: SecurityStatsCardsProps) {
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const warningCount = logs.filter(l => l.severity === 'warning').length;
    const loginFailedCount = logs.filter(l => l.event_type === 'login_failed').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-500">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Total Eventos</p>
                    <p className="text-xl font-black">{totalCount}</p>
                </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Críticos</p>
                    <p className="text-xl font-black text-red-500">{criticalCount}</p>
                </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Advertencias</p>
                    <p className="text-xl font-black text-amber-500">{warningCount}</p>
                </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                    <LogIn className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Logins Fallidos</p>
                    <p className="text-xl font-black text-purple-500">{loginFailedCount}</p>
                </div>
            </div>
        </div>
    );
}
