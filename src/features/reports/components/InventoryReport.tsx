'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Package, AlertTriangle, DollarSign, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { Asset, AssetCategory } from '@/features/assets/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

function calculateDepreciatedValue(asset: Asset): number {
    if (!asset.purchase_value || !asset.purchase_date) return asset.purchase_value ?? 0;
    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();
    const yearsElapsed = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    const annualRate = (asset.depreciation_rate ?? 20) / 100;
    const depreciated = asset.purchase_value * Math.pow(1 - annualRate, yearsElapsed);
    return Math.max(0, Math.round(depreciated));
}

function daysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

// ─── Status styling ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
    Disponible: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    Asignado: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    Mantenimiento: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    Baja: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const WARRANTY_THRESHOLD_DAYS = 90;

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
    icon: Icon,
    label,
    value,
    sub,
    accentClass,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    sub?: string;
    accentClass?: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4 items-start">
            <div className={`mt-0.5 p-2.5 rounded-lg ${accentClass ?? 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function WarrantyDaysBadge({ days }: { days: number }) {
    if (days < 0) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400">
                Vencida
            </span>
        );
    }
    if (days <= 30) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-700 dark:text-red-400">
                {days}d
            </span>
        );
    }
    if (days <= 60) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                {days}d
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400">
            {days}d
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InventoryReport() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [warrantyFilter, setWarrantyFilter] = useState<30 | 60 | 90>(90);

    useEffect(() => {
        const fetchAssets = async () => {
            setLoading(true);
            setError(false);
            try {
                const supabase = createClient();
                const { data, error: fetchError } = await supabase
                    .from('assets')
                    .select('*, entity:entities(name), assignee:profiles(full_name)')
                    .order('category', { ascending: true });

                if (fetchError) throw fetchError;
                setAssets((data ?? []) as Asset[]);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    // ── Derived metrics ──────────────────────────────────────────────────────

    const summary = useMemo(() => {
        const totalValue = assets.reduce((sum, a) => sum + (a.purchase_value ?? 0), 0);
        const totalDepreciated = assets.reduce((sum, a) => sum + calculateDepreciatedValue(a), 0);
        const expiringCount = assets.filter((a) => {
            if (!a.warranty_expiration) return false;
            const days = daysUntil(a.warranty_expiration);
            return days >= 0 && days <= 30;
        }).length;
        return { totalAssets: assets.length, totalValue, totalDepreciated, expiringCount };
    }, [assets]);

    const byCategory = useMemo(() => {
        const map: Record<string, { count: number; value: number; depreciated: number }> = {};
        assets.forEach((a) => {
            const cat = a.category ?? 'General';
            if (!map[cat]) map[cat] = { count: 0, value: 0, depreciated: 0 };
            map[cat].count += 1;
            map[cat].value += a.purchase_value ?? 0;
            map[cat].depreciated += calculateDepreciatedValue(a);
        });
        return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
    }, [assets]);

    const maxCategoryCount = useMemo(
        () => Math.max(...byCategory.map(([, v]) => v.count), 1),
        [byCategory]
    );

    const expiringWarranties = useMemo(() => {
        return assets
            .filter((a) => {
                if (!a.warranty_expiration) return false;
                const days = daysUntil(a.warranty_expiration);
                return days <= warrantyFilter;
            })
            .sort((a, b) => {
                const dA = daysUntil(a.warranty_expiration!);
                const dB = daysUntil(b.warranty_expiration!);
                return dA - dB;
            });
    }, [assets, warrantyFilter]);

    // ── Loading / Error states ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando inventario...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm font-semibold text-foreground">No se pudo cargar el inventario</p>
                <p className="text-xs text-muted-foreground">Verifica tu conexion e intenta de nuevo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            {/* ── Heading ── */}
            <div>
                <h2 className="text-xl font-bold text-foreground">Reporte de Inventario</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Vision general de activos, valores y garantias proximas a vencer
                </p>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    icon={Package}
                    label="Total Activos"
                    value={summary.totalAssets}
                    sub="Registros activos"
                    accentClass="bg-blue-500/10"
                />
                <SummaryCard
                    icon={DollarSign}
                    label="Valor Total"
                    value={formatCurrency(summary.totalValue)}
                    sub="Valor de compra"
                    accentClass="bg-emerald-500/10"
                />
                <SummaryCard
                    icon={DollarSign}
                    label="Valor Depreciado"
                    value={formatCurrency(summary.totalDepreciated)}
                    sub="Valor actual estimado"
                    accentClass="bg-violet-500/10"
                />
                <SummaryCard
                    icon={ShieldCheck}
                    label="Garantias por Vencer"
                    value={summary.expiringCount}
                    sub="En los proximos 30 dias"
                    accentClass={summary.expiringCount > 0 ? 'bg-red-500/10' : 'bg-slate-100 dark:bg-slate-800'}
                />
            </div>

            {/* ── Category Distribution ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-5">
                    Distribucion por Categoria
                </h3>
                {byCategory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
                ) : (
                    <div className="space-y-3">
                        {byCategory.map(([cat, data]) => {
                            const pct = Math.round((data.count / maxCategoryCount) * 100);
                            return (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="w-28 text-xs font-semibold text-muted-foreground shrink-0 truncate">
                                        {cat}
                                    </span>
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                            role="img"
                                            aria-label={`${cat}: ${data.count} activos`}
                                        />
                                    </div>
                                    <span className="w-6 text-xs font-bold text-foreground text-right shrink-0">
                                        {data.count}
                                    </span>
                                    <span className="w-32 text-xs text-muted-foreground text-right shrink-0 hidden sm:block">
                                        {formatCurrency(data.value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Assets Table (grouped by category) ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        Listado de Activos
                    </h3>
                </div>
                {assets.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No hay activos registrados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Nombre
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                                        Serie
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Estado
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                                        Ubicacion
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                                        Valor Compra
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                                        Valor Actual
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {byCategory.map(([cat]) => {
                                    const categoryAssets = assets.filter((a) => (a.category ?? 'General') === cat);
                                    return (
                                        <>
                                            <tr
                                                key={`header-${cat}`}
                                                className="bg-slate-50 dark:bg-slate-800/30"
                                            >
                                                <td
                                                    colSpan={6}
                                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400"
                                                >
                                                    {cat}
                                                    <span className="ml-2 text-muted-foreground font-medium normal-case tracking-normal">
                                                        ({categoryAssets.length})
                                                    </span>
                                                </td>
                                            </tr>
                                            {categoryAssets.map((asset) => (
                                                <tr
                                                    key={asset.id}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-foreground line-clamp-1">
                                                            {asset.name}
                                                        </span>
                                                        {asset.entity?.name && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {asset.entity.name}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        <span className="text-xs font-mono text-muted-foreground">
                                                            {asset.serial_number ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[asset.status] ?? 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            {asset.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 hidden lg:table-cell">
                                                        <span className="text-xs text-muted-foreground">
                                                            {asset.location ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                        <span className="text-xs font-mono text-muted-foreground">
                                                            {asset.purchase_value != null
                                                                ? formatCurrency(asset.purchase_value)
                                                                : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                        <span className="text-xs font-mono text-foreground font-semibold">
                                                            {asset.purchase_value != null
                                                                ? formatCurrency(calculateDepreciatedValue(asset))
                                                                : '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Warranty Expirations ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                            Garantias por Vencer
                        </h3>
                    </div>
                    <div className="flex gap-1.5" role="group" aria-label="Filtro de dias">
                        {([30, 60, 90] as const).map((d) => (
                            <button
                                key={d}
                                onClick={() => setWarrantyFilter(d)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${warrantyFilter === d
                                    ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400'
                                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                aria-pressed={warrantyFilter === d}
                            >
                                {d} dias
                            </button>
                        ))}
                    </div>
                </div>

                {expiringWarranties.length === 0 ? (
                    <div className="p-8 text-center">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No hay garantias por vencer en los proximos {warrantyFilter} dias.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Activo
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                                        Categoria
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                                        Estado
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Vence
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Dias Rest.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {expiringWarranties.map((asset) => {
                                    const days = daysUntil(asset.warranty_expiration!);
                                    return (
                                        <tr
                                            key={asset.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-foreground line-clamp-1">
                                                    {asset.name}
                                                </span>
                                                {asset.entity?.name && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {asset.entity.name}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <span className="text-xs text-muted-foreground">{asset.category}</span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_BADGE[asset.status] ?? 'bg-slate-100 text-slate-600'}`}
                                                >
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(asset.warranty_expiration!)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <WarrantyDaysBadge days={days} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
