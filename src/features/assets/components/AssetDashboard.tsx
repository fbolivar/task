'use client';

import { useMemo } from 'react';
import { Package, DollarSign, TrendingDown, ShieldAlert } from 'lucide-react';
import { Asset, AssetStatus } from '../types';

interface AssetDashboardProps {
    assets: Asset[];
}

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: React.ReactNode;
    iconBg: string;
}

function StatCard({ label, value, sub, icon, iconBg }: StatCardProps) {
    return (
        <div className="card-premium p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1.5">{label}</p>
                <p className="text-xl font-black text-foreground tracking-tight leading-none truncate">{value}</p>
                {sub && <p className="text-[10px] text-muted-foreground font-semibold mt-1">{sub}</p>}
            </div>
        </div>
    );
}

const STATUS_CONFIG: Record<AssetStatus, { label: string; bar: string; text: string }> = {
    Disponible:   { label: 'Disponible',   bar: 'bg-emerald-500', text: 'text-emerald-600' },
    Asignado:     { label: 'Asignado',     bar: 'bg-blue-500',    text: 'text-blue-600'    },
    Mantenimiento:{ label: 'Mantenimiento',bar: 'bg-amber-500',   text: 'text-amber-600'   },
    Baja:         { label: 'Baja',         bar: 'bg-red-500',     text: 'text-red-600'     },
};

const STATUS_ORDER: AssetStatus[] = ['Disponible', 'Asignado', 'Mantenimiento', 'Baja'];

export function AssetDashboard({ assets }: AssetDashboardProps) {
    const metrics = useMemo(() => {
        const total = assets.length;

        let purchaseTotal = 0;
        let depreciatedTotal = 0;
        let warrantiesExpiringSoon = 0;
        const today = new Date();

        const counts: Record<AssetStatus, number> = {
            Disponible: 0,
            Asignado: 0,
            Mantenimiento: 0,
            Baja: 0,
        };

        for (const asset of assets) {
            // Status counts
            if (asset.status in counts) {
                counts[asset.status as AssetStatus]++;
            }

            // Values
            if (asset.purchase_value != null) {
                purchaseTotal += asset.purchase_value;

                if (asset.purchase_date) {
                    const purchaseDate = new Date(asset.purchase_date);
                    const monthsDiff =
                        (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
                        (today.getMonth() - purchaseDate.getMonth());
                    const usefulLifeMonths = asset.useful_life_years * 12;
                    const monthlyDepreciation = asset.purchase_value / usefulLifeMonths;
                    const currentValue = Math.max(0, asset.purchase_value - monthlyDepreciation * monthsDiff);
                    depreciatedTotal += currentValue;
                } else {
                    depreciatedTotal += asset.purchase_value;
                }
            }

            // Warranties expiring in < 30 days
            if (asset.warranty_expiration) {
                const expiry = new Date(asset.warranty_expiration);
                const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 30) {
                    warrantiesExpiringSoon++;
                }
            }
        }

        return { total, purchaseTotal, depreciatedTotal, warrantiesExpiringSoon, counts };
    }, [assets]);

    const fmt = (n: number) =>
        n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0, notation: 'compact' });

    if (metrics.total === 0) return null;

    return (
        <div className="flex flex-col gap-4 animate-reveal">
            {/* Stat cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total activos"
                    value={String(metrics.total)}
                    icon={<Package className="w-5 h-5 text-primary" />}
                    iconBg="bg-primary/10"
                />
                <StatCard
                    label="Valor inventario"
                    value={fmt(metrics.purchaseTotal)}
                    sub="Valor de compra total"
                    icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                    iconBg="bg-emerald-500/10"
                />
                <StatCard
                    label="Valor depreciado"
                    value={fmt(metrics.depreciatedTotal)}
                    sub={`${metrics.purchaseTotal > 0 ? Math.round((metrics.depreciatedTotal / metrics.purchaseTotal) * 100) : 0}% del valor original`}
                    icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
                    iconBg="bg-amber-500/10"
                />
                <StatCard
                    label="Garantías por vencer"
                    value={String(metrics.warrantiesExpiringSoon)}
                    sub="en los próximos 30 días"
                    icon={<ShieldAlert className="w-5 h-5 text-red-600" />}
                    iconBg="bg-red-500/10"
                />
            </div>

            {/* Status distribution bar */}
            <div className="card-premium p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
                    Distribución por estado
                </p>

                {/* Progress bar */}
                <div className="flex w-full h-2.5 rounded-full overflow-hidden gap-px bg-slate-100 dark:bg-slate-800 mb-4">
                    {STATUS_ORDER.map((status) => {
                        const pct = metrics.total > 0 ? (metrics.counts[status] / metrics.total) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                            <div
                                key={status}
                                className={`${STATUS_CONFIG[status].bar} h-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                                title={`${STATUS_CONFIG[status].label}: ${metrics.counts[status]}`}
                            />
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {STATUS_ORDER.map((status) => {
                        const count = metrics.counts[status];
                        const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                        const cfg = STATUS_CONFIG[status];
                        return (
                            <div key={status} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${cfg.bar} shrink-0`} />
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    {cfg.label}
                                </span>
                                <span className={`text-[10px] font-black ${cfg.text}`}>
                                    {count} ({pct}%)
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
