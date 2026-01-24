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
        <div className="card-premium group relative flex flex-col h-full hover:translate-y-[-8px] transition-all duration-500">
            {warranty && (
                <div className={`absolute top-0 left-8 px-4 py-1.5 rounded-b-2xl text-[9px] font-black uppercase tracking-[0.2em] border-x border-b transition-all duration-500 z-10 group-hover:scale-105 ${warranty.color} shadow-sm`}>
                    {warranty.label}
                </div>
            )}

            <div className="p-8 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 shadow-xl group-hover:rotate-6 transition-transform duration-500">
                                <CategoryIcon className="w-8 h-8 group-hover:text-primary transition-colors" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-black text-xl text-foreground tracking-tight truncate group-hover:text-primary transition-all leading-tight mb-2" title={asset.name}>
                                {asset.name}
                            </h3>
                            <div className={`inline-flex px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${statusColors[asset.status]}`}>
                                {asset.status}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                        <button
                            onClick={() => generateAssetReceipt(asset)}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-110"
                            title={t('inventory.action.receipt')}
                        >
                            <FileText className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <button
                            onClick={() => onEdit(asset)}
                            className="p-2.5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all hover:scale-110"
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem icon={<Hash />} label={t('inventory.form.serial')} text={asset.serial_number || 'N/A'} />
                        <InfoItem icon={<Tag />} label={t('inventory.form.category')} text={asset.category} />
                    </div>
                    <InfoItem icon={<MapPin />} label={t('inventory.form.location')} text={asset.location || t('inventory.location.none')} />

                    <div className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10">
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1.5">{t('inventory.estimatedValue')}</p>
                                <p className="text-sm font-black text-foreground tracking-tight">
                                    ${currentValue?.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || '---'}
                                </p>
                            </div>
                        </div>
                        <Sparkles className="w-4 h-4 text-primary animate-pulse opacity-40" />
                    </div>
                </div>

                {/* Assigned Section */}
                {asset.assigned_to && (
                    <div className="flex items-center gap-4 group/user p-1">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/user:opacity-100 transition-opacity" />
                            <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-primary font-black text-[12px] shadow-sm">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1.5">{t('inventory.form.assignedTo')}</p>
                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate max-w-[150px]">{asset.assignee?.full_name || 'Legacy Assignee'}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-8 py-5 bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 mt-auto rounded-b-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <Calendar className="w-4 h-4 text-primary/50" />
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }) : 'Indefinido'}
                </div>
                {asset.purchase_value && (
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-tighter mb-0.5">Original Cost</span>
                        <div className="flex items-center gap-1 text-lg font-black text-foreground tracking-tighter">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span>{parseFloat(asset.purchase_value.toString()).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                )}
            </div>
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
