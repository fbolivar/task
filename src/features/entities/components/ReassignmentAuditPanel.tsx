'use client';

import { useState, useEffect } from 'react';
import { auditService, ReassignmentLog } from '@/features/entities/services/auditService';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
    History,
    ArrowRightCircle,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    AlertCircle,
    UserCircle,
    Activity
} from 'lucide-react';

export function ReassignmentAuditPanel() {
    const activeEntityId = useAuthStore(state => state.activeEntityId);
    const [logs, setLogs] = useState<ReassignmentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await auditService.getReassignmentLogs(activeEntityId);
                setLogs(data);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [activeEntityId]);

    const filteredLogs = logs.filter(log =>
        log.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.new_assignee_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                        <History className="w-6 h-6 text-primary" />
                        Historial de Autogestión
                    </h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Auditoría síncrona de re-asignaciones automáticas</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar tarea o responsable..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all w-full md:w-80"
                    />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Traspasos Totales"
                    value={logs.length.toString()}
                    color="primary"
                />
                <StatCard
                    icon={<AlertCircle className="w-5 h-5" />}
                    label="Tareas Críticas"
                    value={logs.filter(l => l.task_priority === 'Alta').length.toString()}
                    color="rose"
                />
                <StatCard
                    icon={<UserCircle className="w-5 h-5" />}
                    label="Nuevos Responsables"
                    value={new Set(logs.map(l => l.new_assignee_name)).size.toString()}
                    color="amber"
                />
            </div>

            {/* Logs Timeline/List */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hito Operativo</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Ownership Transfer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Razón de Auditoría</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-xs font-bold text-foreground">
                                                    {new Date(log.created_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-medium text-muted-foreground">
                                                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-foreground break-words group-hover:text-primary transition-colors">
                                                        {log.task_title}
                                                    </span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${log.task_priority === 'Alta' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                                                        }`}>
                                                        {log.task_priority}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground font-medium">{log.entity_name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                <span className="text-muted-foreground line-through opacity-40">{log.previous_assignee_name || 'Sin asignar'}</span>
                                                <ArrowRightCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-emerald-500">{log.new_assignee_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="max-w-xs">
                                                <p className="text-[10px] text-muted-foreground leading-relaxed italic font-medium">
                                                    {log.reason}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                                            <History className="w-12 h-12" />
                                            <p className="text-sm font-black uppercase tracking-widest">Sin registros detectados</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: 'primary' | 'rose' | 'amber' }) {
    const colors = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    };

    return (
        <div className="glass-card p-5 flex items-center gap-4 border-b-2 hover:-translate-y-1 transition-all">
            <div className={`p-3 rounded-2xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
                <h4 className="text-xl font-black text-foreground mt-0.5">{value}</h4>
            </div>
        </div>
    );
}
