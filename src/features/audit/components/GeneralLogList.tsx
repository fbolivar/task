'use client';

import { Activity, FileText, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuditLog } from './types';
import { ACTION_ICONS, ACTION_COLORS, ENTITY_ICONS } from './constants';

interface GeneralLogListProps {
    logs: AuditLog[];
    loading: boolean;
}

export function GeneralLogList({ logs, loading }: GeneralLogListProps) {
    if (loading) {
        return (
            <div className="glass-card p-8 text-center">
                <Activity className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Cargando registros...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-bold text-muted-foreground">Sin registros</p>
                <p className="text-xs text-muted-foreground">No hay actividades que coincidan</p>
            </div>
        );
    }

    return (
        <div className="glass-card divide-y divide-border overflow-hidden">
            {logs.map((log) => {
                const ActionIcon = ACTION_ICONS[log.action] || Activity;
                const EntityIcon = ENTITY_ICONS[log.entity_type] || FileText;
                const actionColor = ACTION_COLORS[log.action] || 'bg-slate-500/10 text-slate-600';

                return (
                    <div
                        key={log.id}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl ${actionColor}`}>
                                <ActionIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-sm truncate">
                                        {log.user?.full_name || 'Sistema'}
                                    </span>
                                    <span className="text-muted-foreground text-xs">realizó</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${actionColor}`}>
                                        {log.action}
                                    </span>
                                    <span className="text-muted-foreground text-xs">en</span>
                                    <span className="flex items-center gap-1 text-xs font-medium text-primary">
                                        <EntityIcon className="w-3 h-3" />
                                        {log.entity_type}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {log.description}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-xs font-medium text-foreground">
                                    {format(new Date(log.created_at), 'dd MMM yyyy', { locale: es })}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {format(new Date(log.created_at), 'HH:mm:ss')}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
