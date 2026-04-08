'use client';

import { Shield, User, Wifi, LogIn, LogOut, Lock, Key, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { SecurityLog } from './types';
import { SECURITY_EVENT_LABELS, SEVERITY_COLORS } from './constants';

const SECURITY_EVENT_ICONS: Record<string, typeof Shield> = {
    login_success: LogIn, login_failed: AlertCircle, logout: LogOut,
    password_change: Lock, api_access: Key, permission_change: Shield,
    session_expired: Clock, mfa_enabled: Shield, mfa_disabled: AlertTriangle,
};

interface SecurityLogListProps {
    logs: SecurityLog[];
    loading: boolean;
}

export function SecurityLogList({ logs, loading }: SecurityLogListProps) {
    if (loading) {
        return (
            <div className="glass-card p-8 text-center">
                <Shield className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Cargando eventos de seguridad...</p>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-bold text-muted-foreground">Sin eventos</p>
                <p className="text-xs text-muted-foreground">No hay eventos de seguridad registrados</p>
            </div>
        );
    }

    return (
        <div className="glass-card divide-y divide-border overflow-hidden">
            {logs.map((log) => {
                const EventIcon = SECURITY_EVENT_ICONS[log.event_type] || Shield;
                const severityColor = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;
                const eventLabel = SECURITY_EVENT_LABELS[log.event_type] || log.event_type;

                return (
                    <div
                        key={log.id}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`p-2.5 rounded-xl ${severityColor}`}>
                                <EventIcon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-bold text-sm">
                                        {eventLabel}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${severityColor}`}>
                                        {log.severity}
                                    </span>
                                    {log.user && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {log.user.full_name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {log.ip_address && (
                                        <span className="flex items-center gap-1">
                                            <Wifi className="w-3 h-3" />
                                            {log.ip_address}
                                        </span>
                                    )}
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                            {JSON.stringify(log.details).slice(0, 50)}...
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Timestamp */}
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
