'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Plus, Edit, Trash2, Eye, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogEntry {
    id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    description: string;
    created_at: string;
    user?: { full_name: string; email: string };
}

interface ActivityTimelineProps {
    entityType: string;
    entityId: string;
    maxItems?: number;
    className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_ICON_MAP: Record<string, React.ElementType> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view:   Eye,
    approve: CheckCircle,
    reject:  AlertCircle,
};

const ACTION_COLOR_MAP: Record<string, { dot: string; icon: string; badge: string }> = {
    create:  { dot: 'bg-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    update:  { dot: 'bg-blue-500',    icon: 'text-blue-600 dark:text-blue-400',       badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    delete:  { dot: 'bg-red-500',     icon: 'text-red-600 dark:text-red-400',         badge: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    view:    { dot: 'bg-slate-400',   icon: 'text-slate-500 dark:text-slate-400',     badge: 'bg-slate-500/10 text-slate-500 dark:text-slate-400' },
    approve: { dot: 'bg-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    reject:  { dot: 'bg-red-500',     icon: 'text-red-600 dark:text-red-400',         badge: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

const ACTION_LABELS: Record<string, string> = {
    create:  'creó',
    update:  'actualizó',
    delete:  'eliminó',
    view:    'consultó',
    approve: 'aprobó',
    reject:  'rechazó',
};

const AVATAR_COLORS = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-orange-500',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(fullName: string): string {
    return fullName.trim().charAt(0).toUpperCase();
}

function formatRelativeDate(dateStr: string): string {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
        return dateStr;
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
    const colorClass = getAvatarColor(name);
    return (
        <div
            className={`w-7 h-7 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-slate-900`}
            aria-label={name}
        >
            <span className="text-white text-[11px] font-bold leading-none">{getInitial(name)}</span>
        </div>
    );
}

function ActionBadge({ action }: { action: string }) {
    const colors = ACTION_COLOR_MAP[action] ?? ACTION_COLOR_MAP.view;
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${colors.badge}`}>
            {action}
        </span>
    );
}

function TimelineItem({ log, isLast }: { log: AuditLogEntry; isLast: boolean }) {
    const ActionIcon = ACTION_ICON_MAP[log.action] ?? Activity;
    const colors = ACTION_COLOR_MAP[log.action] ?? ACTION_COLOR_MAP.view;
    const authorName = log.user?.full_name ?? 'Sistema';
    const actionLabel = ACTION_LABELS[log.action] ?? log.action;

    return (
        <div className="flex gap-3 group">
            {/* Left rail: avatar + connector */}
            <div className="flex flex-col items-center">
                <UserAvatar name={authorName} />
                {!isLast && (
                    <div className="w-px flex-1 mt-1.5 bg-slate-200 dark:bg-slate-700 min-h-[16px]" />
                )}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0 ${isLast ? '' : ''}`}>
                {/* Header row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                        {authorName}
                    </span>
                    <span className="text-xs text-muted-foreground">{actionLabel}</span>
                    <ActionBadge action={log.action} />
                </div>

                {/* Description */}
                {log.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {log.description}
                    </p>
                )}

                {/* Timestamp */}
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                    {formatRelativeDate(log.created_at)}
                </p>
            </div>

            {/* Action icon accent (right) */}
            <div className={`flex-shrink-0 mt-0.5 ${colors.icon} opacity-50 group-hover:opacity-100 transition-opacity`}>
                <ActionIcon className="w-3.5 h-3.5" />
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 px-4 py-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-0.5">
                        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-2.5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="h-2 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Sin actividad registrada</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
                Los cambios en este registro aparecerán aqui.
            </p>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-xs text-muted-foreground mb-3">No se pudo cargar el historial.</p>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
                <RefreshCw className="w-3 h-3" />
                Reintentar
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityTimeline({
    entityType,
    entityId,
    maxItems = 20,
    className = '',
}: ActivityTimelineProps) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(false);

        try {
            const supabase = createClient();
            const { data, error: queryError } = await supabase
                .from('audit_logs')
                .select('id, user_id, entity_type, entity_id, action, description, created_at, user:user_id(full_name, email)')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false })
                .limit(maxItems);

            if (queryError) throw queryError;

            // Supabase returns the joined user as an object or array; normalise it
            const normalised: AuditLogEntry[] = (data ?? []).map((row: AuditLogEntry & { user: unknown }) => ({
                ...row,
                user: Array.isArray(row.user) ? (row.user[0] as { full_name: string; email: string }) : (row.user as { full_name: string; email: string } | undefined),
            }));

            setLogs(normalised);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId, maxItems]);

    useEffect(() => {
        if (entityId) {
            fetchLogs();
        }
    }, [fetchLogs, entityId]);

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Historial de actividad
                    </span>
                </div>
                {!loading && logs.length > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full font-medium">
                        {logs.length}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[420px]">
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorState onRetry={fetchLogs} />
                ) : logs.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="px-4 pt-4">
                        {logs.map((log, index) => (
                            <TimelineItem
                                key={log.id}
                                log={log}
                                isLast={index === logs.length - 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
