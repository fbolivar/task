'use client';

import {
    Tag,
    Hash,
    MapPin,
    User,
    Calendar,
    Edit2,
    Trash2,
    Building2,
    DollarSign,
    Box,
    Laptop,
    Car,
    Smartphone,
    Sofa,
    Wrench,
    TrendingDown,
    FileText,
    Sparkles
} from 'lucide-react';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { generateAssetReceipt } from '../utils/receiptGenerator';
import { useSettings } from '@/shared/contexts/SettingsContext';
import React from 'react';

interface AssetCardProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

const statusColors: Record<AssetStatus, string> = {
    'Disponible': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Asignado': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    'Mantenimiento': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'Baja': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const categoryIcons: Record<AssetCategory, any> = {
    'Hardware': Laptop,
    'Software': Smartphone,
    'Mobiliario': Sofa,
    'Vehículo': Car,
    'Herramientas': Wrench,
    'General': Box,
};

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
    const { t } = useSettings();
    const CategoryIcon = categoryIcons[asset.category] || Box;

    const getWarrantyStatus = () => {
        if (!asset.warranty_expiration) return null;
        const expiry = new Date(asset.warranty_expiration);
        const today = new Date();
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: t('inventory.warranty.expired'), color: 'text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/10' };
        if (diffDays <= 30) return { label: `${t('inventory.warranty.expiring')} (${diffDays}d)`, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10 animate-pulse' };
        return null;
    };

    const calculateCurrentValue = () => {
        if (!asset.purchase_value || !asset.purchase_date) return null;
        const purchaseDate = new Date(asset.purchase_date);
        const today = new Date();
        const monthsDiff = (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth());
        const usefulLifeMonths = asset.useful_life_years * 12;
        const monthlyDepreciation = asset.purchase_value / usefulLifeMonths;
        const currentValue = Math.max(0, asset.purchase_value - (monthlyDepreciation * monthsDiff));
        return currentValue;
    };

    const warranty = getWarrantyStatus();
    const currentValue = calculateCurrentValue();

    return (
        <div className="card-premium group relative p-6 transition-all duration-500 hover:translate-y-[-4px] h-full flex flex-col">
            {/* Header: Icon, Title, Actions */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                        <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-foreground tracking-tight leading-none mb-1.5 truncate max-w-[140px]" title={asset.name}>
                            {asset.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            <Tag className="w-3 h-3" />
                            {asset.category}
                        </div>
                    </div>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={() => generateAssetReceipt(asset)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(asset);
                        }}
                        className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Body: Stacked Pills */}
            <div className="flex flex-col gap-3 flex-1">
                {/* Serial */}
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-white/5">
                    <Hash className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-wider">
                        {asset.serial_number || 'SIN SERIAL'}
                    </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-wider uppercase">
                        {asset.location || 'SIN UBICACIÓN'}
                    </span>
                </div>

                {/* Value */}
                {currentValue !== null && (
                    <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                            {currentValue.toLocaleString('es-CO', { maximumFractionDigits: 0, notation: 'compact' })} M
                        </span>
                    </div>
                )}
            </div>

            <div className="my-6 h-px w-full bg-slate-100 dark:bg-slate-800" />

            {/* Footer: Assignee & Status */}
            <div className="flex justify-between items-center mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Asignado A</span>
                        <span className="text-xs font-black text-foreground uppercase tracking-tight">
                            {asset.assignee?.full_name?.split(' ')[0] || 'NADIE'}
                        </span>
                    </div>
                </div>

                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${statusColors[asset.status]}`}>
                    {asset.status}
                </div>
            </div>

            {warranty && (
                <div className={`absolute top-4 right-20 w-2 h-2 rounded-full ${warranty.color.includes('rose') ? 'bg-rose-500' : 'bg-amber-500'}`} title={warranty.label} />
            )}
        </div>
    );
}

function InfoItem({ icon, label, text }: { icon: any, label: string, text: string }) {
    return (
        <div className="flex items-center gap-4 text-xs group/item cursor-default overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-slate-100/50 dark:bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 group-hover/item:scale-110 transition-all border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="text-muted-foreground group-hover/item:text-primary transition-colors">
                    {React.cloneElement(icon, { className: "w-4 h-4" })}
                </div>
            </div>
            <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/50 leading-none mb-1.5">{label}</p>
                <p className="font-black text-foreground tracking-tight text-[11px] uppercase truncate">{text}</p>
            </div>
        </div>
    );
}
