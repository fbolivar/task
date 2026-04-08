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
    Sparkles,
    QrCode,
    Download,
    X,
    ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Asset, AssetStatus, AssetCategory } from '../types';
import { generateAssetReceipt } from '../utils/receiptGenerator';
import { useSettings } from '@/shared/contexts/SettingsContext';
import React, { useState, useCallback } from 'react';
import QRCode from 'qrcode';

interface AssetCardProps {
    asset: Asset;
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
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

interface QrModalProps {
    dataUrl: string;
    assetName: string;
    onClose: () => void;
}

function QrModal({ dataUrl, assetName, onClose }: QrModalProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `qr-${assetName.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.click();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-reveal"
            role="dialog"
            aria-modal="true"
            aria-label={`Código QR de ${assetName}`}
            onClick={onClose}
        >
            <div
                className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Cerrar modal QR"
                >
                    <X className="w-4 h-4" />
                </button>

                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 text-center mb-1">
                        Código QR
                    </p>
                    <p className="text-sm font-black text-foreground tracking-tight text-center">{assetName}</p>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={dataUrl}
                    alt={`Código QR para ${assetName}`}
                    className="w-48 h-48 rounded-2xl border border-slate-200 dark:border-white/10"
                />

                <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 w-full justify-center"
                >
                    <Download className="w-4 h-4" />
                    Descargar QR
                </button>
            </div>
        </div>
    );
}

export function AssetCard({ asset, onEdit, onDelete, isSelected = false, onToggleSelect }: AssetCardProps) {
    const { t } = useSettings();
    const CategoryIcon = categoryIcons[asset.category] || Box;
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [generatingQr, setGeneratingQr] = useState(false);

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

    const handleShowQr = useCallback(async () => {
        if (generatingQr) return;
        setGeneratingQr(true);
        try {
            const text = [
                asset.name,
                asset.serial_number ? `Serial: ${asset.serial_number}` : '',
                `ID: ${asset.id}`,
            ]
                .filter(Boolean)
                .join('\n');

            const dataUrl = await QRCode.toDataURL(text, {
                width: 400,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            });
            setQrDataUrl(dataUrl);
        } catch {
            // Silently fail — QR generation is non-critical
        } finally {
            setGeneratingQr(false);
        }
    }, [asset.id, asset.name, asset.serial_number, generatingQr]);

    const warranty = getWarrantyStatus();
    const currentValue = calculateCurrentValue();
    const ariaPressed: 'true' | 'false' = isSelected ? 'true' : 'false';

    return (
        <>
            <div className={`card-premium group relative p-6 transition-all duration-500 hover:translate-y-[-4px] h-full flex flex-col ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : ''}`}>
                {/* Selection checkbox */}
                {onToggleSelect && (
                    <button
                        type="button"
                        onClick={() => onToggleSelect(asset.id)}
                        className={`absolute top-4 left-4 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 z-10 ${
                            isSelected
                                ? 'bg-primary border-primary shadow-lg shadow-primary/30 scale-110'
                                : 'border-slate-200 dark:border-white/10 hover:border-primary hover:scale-110 bg-white dark:bg-slate-900'
                        }`}
                        aria-label={isSelected ? 'Deseleccionar activo' : 'Seleccionar activo'}
                        aria-pressed={ariaPressed}
                    >
                        {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" aria-hidden="true" />
                        )}
                    </button>
                )}

                {/* Header: Icon, Title, Actions */}
                <div className={`flex justify-between items-start mb-6 ${onToggleSelect ? 'pl-8' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform">
                            <CategoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg tracking-tight leading-none mb-1.5 truncate max-w-[140px]" title={asset.name}>
                                <Link
                                    href={`/inventario/${asset.id}`}
                                    className="text-foreground hover:text-primary transition-colors"
                                    aria-label={`Ver detalle de ${asset.name}`}
                                >
                                    {asset.name}
                                </Link>
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                <Tag className="w-3 h-3" />
                                {asset.category}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <Link
                            href={`/inventario/${asset.id}`}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            aria-label={`Ver detalle de ${asset.name}`}
                            title="Ver Detalle"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => generateAssetReceipt(asset)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Descargar recibo del activo"
                            title="Descargar recibo"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleShowQr}
                            disabled={generatingQr}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-wait"
                            aria-label="Mostrar código QR del activo"
                            title="Ver código QR"
                        >
                            <QrCode className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(asset);
                            }}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            aria-label="Editar activo"
                            title="Editar"
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

            {qrDataUrl && (
                <QrModal
                    dataUrl={qrDataUrl}
                    assetName={asset.name}
                    onClose={() => setQrDataUrl(null)}
                />
            )}
        </>
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
