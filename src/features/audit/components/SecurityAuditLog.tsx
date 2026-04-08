'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RefreshCw, Download, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { SecurityLog } from './types';
import { SecurityStatsCards } from './SecurityStatsCards';
import { SecurityFilters } from './SecurityFilters';
import { SecurityLogList } from './SecurityLogList';
import { AuditPagination } from './AuditPagination';

const ITEMS_PER_PAGE = 20;

export function SecurityAuditLog() {
    const [logs, setLogs] = useState<SecurityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterEventType, setFilterEventType] = useState<string>('');
    const [filterSeverity, setFilterSeverity] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

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

        if (filterEventType) query = query.eq('event_type', filterEventType);
        if (filterSeverity) query = query.eq('severity', filterSeverity);
        if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString());
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59);
            query = query.lte('created_at', endDate.toISOString());
        }

        const { data, count } = await query;
        if (data) {
            setLogs(data);
            setTotalCount(count || 0);
        }
        setLoading(false);
    };

    const handleClearFilters = () => {
        setFilterEventType('');
        setFilterSeverity('');
        setDateFrom('');
        setDateTo('');
        setPage(0);
    };

    const handleFilterEventTypeChange = (value: string) => {
        setFilterEventType(value);
        setPage(0);
    };

    const handleFilterSeverityChange = (value: string) => {
        setFilterSeverity(value);
        setPage(0);
    };

    const handleDateFromChange = (value: string) => {
        setDateFrom(value);
        setPage(0);
    };

    const handleDateToChange = (value: string) => {
        setDateTo(value);
        setPage(0);
    };

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

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

            <SecurityStatsCards totalCount={totalCount} logs={logs} />

            <SecurityFilters
                filterEventType={filterEventType}
                filterSeverity={filterSeverity}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onFilterEventTypeChange={handleFilterEventTypeChange}
                onFilterSeverityChange={handleFilterSeverityChange}
                onDateFromChange={handleDateFromChange}
                onDateToChange={handleDateToChange}
                onClearFilters={handleClearFilters}
            />

            <SecurityLogList logs={logs} loading={loading} />

            <AuditPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}
