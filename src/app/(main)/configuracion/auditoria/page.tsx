'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ReassignmentAuditPanel } from '@/features/entities/components/ReassignmentAuditPanel';
import {
    Activity, Search, Filter, ChevronLeft, ChevronRight,
    User, FileText, FolderKanban, Package, Clock,
    AlertCircle, CheckCircle, Edit, Trash2, Plus, Eye,
    Download, RefreshCw, Calendar, History, ListFilter,
    Shield, Key, LogIn, LogOut, Lock, Wifi, Globe, AlertTriangle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
    id: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    action: string;
    description: string;
    created_at: string;
    user?: { full_name: string; email: string };
}

interface SecurityLog {
    id: string;
    user_id: string | null;
    event_type: string;
    severity: 'info' | 'warning' | 'critical';
    ip_address: string | null;
    user_agent: string | null;
    details: Record<string, unknown>;
    created_at: string;
    user?: { full_name: string; email: string };
}

const ACTION_ICONS: Record<string, typeof Edit> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    login: User,
    logout: User,
    approve: CheckCircle,
    reject: AlertCircle,
};

const ACTION_COLORS: Record<string, string> = {
    create: 'bg-emerald-500/10 text-emerald-600',
    update: 'bg-blue-500/10 text-blue-600',
    delete: 'bg-red-500/10 text-red-600',
    view: 'bg-slate-500/10 text-slate-600',
    login: 'bg-purple-500/10 text-purple-600',
    logout: 'bg-purple-500/10 text-purple-600',
    approve: 'bg-emerald-500/10 text-emerald-600',
    reject: 'bg-red-500/10 text-red-600',
};

const ENTITY_ICONS: Record<string, typeof FileText> = {
    task: FileText,
    project: FolderKanban,
    asset: Package,
    user: User,
    change_request: Activity,
};

const SECURITY_EVENT_ICONS: Record<string, typeof Shield> = {
    login_success: LogIn,
    login_failed: AlertCircle,
    logout: LogOut,
    password_change: Lock,
    api_access: Key,
    permission_change: Shield,
    session_expired: Clock,
    mfa_enabled: Shield,
    mfa_disabled: AlertTriangle,
};

const SECURITY_EVENT_LABELS: Record<string, string> = {
    login_success: 'Inicio de sesión exitoso',
    login_failed: 'Intento de login fallido',
    logout: 'Cierre de sesión',
    password_change: 'Cambio de contraseña',
    api_access: 'Acceso vía API',
    permission_change: 'Cambio de permisos',
    session_expired: 'Sesión expirada',
    mfa_enabled: 'MFA habilitado',
    mfa_disabled: 'MFA deshabilitado',
};

const SEVERITY_COLORS: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    critical: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function AuditoriaPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'autogestion' | 'security'>('general');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-border overflow-x-auto">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'general'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <ListFilter className="w-4 h-4" />
                    Log General
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'security'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <Shield className="w-4 h-4" />
                    Log de Seguridad
                </button>
                <button
                    onClick={() => setActiveTab('autogestion')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeTab === 'autogestion'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <History className="w-4 h-4" />
                    Autogestión
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'general' && <GeneralAuditLog />}
            {activeTab === 'security' && <SecurityAuditLog />}
            {activeTab === 'autogestion' && <ReassignmentAuditPanel />}
        </div>
    );
}

// ============ SECURITY AUDIT LOG ============
function SecurityAuditLog() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEventType, setFilterEventType] = useState<string>('');
    const [filterSeverity, setFilterSeverity] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, [page, filterEventType, filterSeverity, dateFrom, dateTo]);

    const fetchLogs = async () => {
        setLoading(true);

        let query = supabase
            .from('security_logs')
            .select(`
                *,
                user:profiles!security_logs_user_id_fkey(full_name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (filterEventType) {
            query = query.eq('event_type', filterEventType);
        }
        if (filterSeverity) {
            query = query.eq('severity', filterSeverity);
        }
        if (dateFrom) {
            query = query.gte('created_at', new Date(dateFrom).toISOString());
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
        }

        const { data, error, count } = await query;

        if (data) {
            setLogs(data);
            setTotalCount(count || 0);
        }
        setLoading(false);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Stats
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const warningCount = logs.filter(l => l.severity === 'warning').length;
    const loginFailedCount = logs.filter(l => l.event_type === 'login_failed').length;

    const exportToCSV = () => {
        const headers = ['Fecha', 'Evento', 'Severidad', 'IP', 'Usuario', 'Detalles'];
        const rows = logs.map(log => [
            format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
            log.event_type,
            log.severity,
            log.ip_address || 'N/A',
            log.user?.full_name || 'Sistema',
            JSON.stringify(log.details)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-foreground">Log de Seguridad</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Eventos de autenticación, accesos y cambios de seguridad
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                    <button onClick={exportToCSV} className="btn-primary flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
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

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Event Type Filter */}
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterEventType}
                            onChange={(e) => { setFilterEventType(e.target.value); setPage(0); }}
                            className="input-premium pl-10 w-full appearance-none"
                        >
                            <option value="">Todos los eventos</option>
                            <option value="login_success">Login Exitoso</option>
                            <option value="login_failed">Login Fallido</option>
                            <option value="logout">Logout</option>
                            <option value="password_change">Cambio Contraseña</option>
                            <option value="api_access">Acceso API</option>
                            <option value="session_expired">Sesión Expirada</option>
                        </select>
                    </div>

                    {/* Severity Filter */}
                    <div className="relative">
                        <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterSeverity}
                            onChange={(e) => { setFilterSeverity(e.target.value); setPage(0); }}
                            className="input-premium pl-10 w-full appearance-none"
                        >
                            <option value="">Todas las severidades</option>
                            <option value="info">Info</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                            className="input-premium w-full text-xs"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                            className="input-premium w-full text-xs"
                        />
                    </div>

                    {/* Clear Filters */}
                    {(filterEventType || filterSeverity || dateFrom || dateTo) && (
                        <button
                            onClick={() => {
                                setFilterEventType('');
                                setFilterSeverity('');
                                setDateFrom('');
                                setDateTo('');
                                setPage(0);
                            }}
                            className="btn-secondary text-xs"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Log List */}
            <div className="glass-card divide-y divide-border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Shield className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Cargando eventos de seguridad...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="font-bold text-muted-foreground">Sin eventos</p>
                        <p className="text-xs text-muted-foreground">No hay eventos de seguridad registrados</p>
                    </div>
                ) : (
                    logs.map((log) => {
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
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página {page + 1} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============ GENERAL AUDIT LOG ============
function GeneralAuditLog() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterEntity, setFilterEntity] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const ITEMS_PER_PAGE = 20;

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, [page, filterAction, filterEntity, dateFrom, dateTo]);

    const fetchLogs = async () => {
        setLoading(true);

        let query = supabase
            .from('activity_logs')
            .select(`
                *,
                user:profiles!activity_logs_user_id_fkey(full_name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (filterAction) {
            query = query.eq('action', filterAction);
        }
        if (filterEntity) {
            query = query.eq('entity_type', filterEntity);
        }
        if (dateFrom) {
            query = query.gte('created_at', new Date(dateFrom).toISOString());
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
        }

        const { data, error, count } = await query;

        if (data) {
            setLogs(data);
            setTotalCount(count || 0);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            log.description?.toLowerCase().includes(q) ||
            log.user?.full_name?.toLowerCase().includes(q) ||
            log.entity_type?.toLowerCase().includes(q) ||
            log.action?.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const exportToCSV = () => {
        const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'Descripción'];
        const rows = filteredLogs.map(log => [
            format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
            log.user?.full_name || 'Sistema',
            log.action,
            log.entity_type,
            log.description
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-foreground">Log de Actividades</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Registro completo de actividades del sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2 text-sm">
                        <RefreshCw className="w-4 h-4" />
                        Actualizar
                    </button>
                    <button onClick={exportToCSV} className="btn-primary flex items-center gap-2 text-sm">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar en descripción, usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-premium pl-10 w-full"
                        />
                    </div>

                    {/* Action Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterAction}
                            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
                            className="input-premium pl-10 w-full appearance-none"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="create">Crear</option>
                            <option value="update">Actualizar</option>
                            <option value="delete">Eliminar</option>
                            <option value="view">Ver</option>
                            <option value="login">Login</option>
                            <option value="logout">Logout</option>
                            <option value="approve">Aprobar</option>
                            <option value="reject">Rechazar</option>
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <div className="relative">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                            value={filterEntity}
                            onChange={(e) => { setFilterEntity(e.target.value); setPage(0); }}
                            className="input-premium pl-10 w-full appearance-none"
                        >
                            <option value="">Todas las entidades</option>
                            <option value="task">Tareas</option>
                            <option value="project">Proyectos</option>
                            <option value="asset">Activos</option>
                            <option value="user">Usuarios</option>
                            <option value="change_request">Cambios</option>
                            <option value="entity">Entidades</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                            className="input-premium w-full text-xs"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                            className="input-premium w-full text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-bold">{totalCount.toLocaleString()} registros</span>
                {(filterAction || filterEntity || dateFrom || dateTo) && (
                    <button
                        onClick={() => {
                            setFilterAction('');
                            setFilterEntity('');
                            setDateFrom('');
                            setDateTo('');
                            setPage(0);
                        }}
                        className="text-primary hover:underline text-xs"
                    >
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Log List */}
            <div className="glass-card divide-y divide-border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Activity className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm">Cargando registros...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center">
                        <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="font-bold text-muted-foreground">Sin registros</p>
                        <p className="text-xs text-muted-foreground">No hay actividades que coincidan</p>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
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
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Página {page + 1} de {totalPages}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="btn-secondary p-2 disabled:opacity-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
