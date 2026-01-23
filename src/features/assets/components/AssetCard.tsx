'use client';

import {
    Tag,
    Hash,
    MapPin,
    User,
    Calendar,
    Edit2,
    Trash2,
    MoreVertical,
    Building2,
    DollarSign,
    Box,
    Laptop,
    Car,
    Smartphone,
    Sofa,
    Wrench,
    TrendingDown,
    FileText
} from 'lucide-react';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { generateAssetReceipt } from '../utils/receiptGenerator';

interface AssetCardProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

const statusColors: Record<AssetStatus, string> = {
    'Disponible': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Asignado': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Mantenimiento': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'Baja': 'bg-red-500/10 text-red-600 border-red-500/20',
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
    const CategoryIcon = categoryIcons[asset.category] || Box;

    const getWarrantyStatus = () => {
        if (!asset.warranty_expiration) return null;
        const expiry = new Date(asset.warranty_expiration);
        const today = new Date();
        const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Garantía Vencida', color: 'text-red-500 bg-red-500/10 border-red-500/20' };
        if (diffDays <= 30) return { label: `Garantía por vencer (${diffDays}d)`, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse' };
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
        <div className="group relative glass-card p-6 border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
            {warranty && (
                <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${warranty.color} z-10 shadow-lg`}>
                    {warranty.label}
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-500">
                        <CategoryIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{asset.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${statusColors[asset.status]}`}>
                                {asset.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => generateAssetReceipt(asset)}
                        className="p-2 hover:bg-slate-500/10 hover:text-slate-600 rounded-xl transition-all"
                        title="Generar Acta de Entrega (PDF)"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(asset)}
                        className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                        title="Editar Activo"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(asset.id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
                        title="Eliminar Activo"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Hash />} label="Serial" text={asset.serial_number || 'N/A'} />
                    <InfoItem icon={<Tag />} label="Categoría" text={asset.category} />
                </div>
                <InfoItem icon={<MapPin />} label="Ubicación" text={asset.location || 'Sin ubicación'} />
                {asset.assigned_to && (
                    <InfoItem icon={<User />} label="Asignado a" text={asset.assignee?.full_name || 'Cargando...'} />
                )}
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem icon={<Building2 />} label="Entidad" text={asset.entity?.name || 'Sistema'} />
                    {currentValue !== null && (
                        <div className="flex items-center gap-3 text-xs group/item cursor-default overflow-hidden">
                            <div className="w-7 h-7 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">Valor Est.</p>
                                <p className="font-bold text-emerald-600 truncate">
                                    ${currentValue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'Sin fecha'}
                </div>
                {asset.purchase_value && (
                    <div className="flex items-center gap-1.5 text-foreground font-black">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span>{parseFloat(asset.purchase_value.toString()).toLocaleString('es-CO', { minimumFractionDigits: 0 })}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ icon, label, text }: { icon: any, label: string, text: string }) {
    return (
        <div className="flex items-center gap-3 text-xs group/item cursor-default overflow-hidden">
            <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                <div className="text-muted-foreground group-hover/item:text-primary transition-colors">
                    {icon}
                </div>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 leading-none mb-1">{label}</p>
                <p className="font-bold text-foreground truncate">{text}</p>
            </div>
        </div>
    );
}
