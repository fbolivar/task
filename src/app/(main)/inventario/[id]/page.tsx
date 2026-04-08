'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit2,
    FileText,
    Package,
    Laptop,
    Car,
    Smartphone,
    Sofa,
    Wrench,
    Box,
    Hash,
    MapPin,
    User,
    Building2,
    DollarSign,
    Calendar,
    TrendingDown,
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Plus,
    Loader2,
    ChevronRight,
    Wrench as WrenchIcon,
    Activity,
    ArrowRight,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Asset, AssetCategory, AssetStatus, AssetFormData } from '@/features/assets/types';
import { AssetModal } from '@/features/assets/components/AssetModal';
import { assetService } from '@/features/assets/services/assetService';
import { generateAssetReceipt } from '@/features/assets/utils/receiptGenerator';
import { useToast } from '@/shared/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type MaintenanceType = 'preventivo' | 'correctivo' | 'mejora';

interface MaintenanceRecord {
    id: string;
    asset_id: string;
    description: string;
    type: MaintenanceType;
    cost: number | null;
    date: string;
    completed: boolean;
    created_at: string;
}

interface AssetHistoryRecord {
    id: string;
    asset_id: string;
    action: string;
    from_user_id: string | null;
    to_user_id: string | null;
    notes: string | null;
    created_at: string;
    from_user?: { full_name: string } | null;
    to_user?: { full_name: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusColors: Record<AssetStatus, string> = {
    'Disponible': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Asignado': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    'Mantenimiento': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'Baja': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const categoryIcons: Record<AssetCategory, React.ElementType> = {
    'Hardware': Laptop,
    'Software': Smartphone,
    'Mobiliario': Sofa,
    'Vehículo': Car,
    'Herramientas': Wrench,
    'General': Box,
};

const maintenanceTypeColors: Record<MaintenanceType, string> = {
    preventivo: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    correctivo: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    mejora: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function calculateCurrentValue(asset: Asset): number | null {
    if (!asset.purchase_value || !asset.purchase_date) return null;
    const purchaseDate = new Date(asset.purchase_date);
    const today = new Date();
    const monthsDiff =
        (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
        (today.getMonth() - purchaseDate.getMonth());
    const usefulLifeMonths = asset.useful_life_years * 12;
    const monthlyDepreciation = asset.purchase_value / usefulLifeMonths;
    return Math.max(0, asset.purchase_value - monthlyDepreciation * monthsDiff);
}

function getWarrantyInfo(asset: Asset): { label: string; daysRemaining: number; status: 'ok' | 'expiring' | 'expired' } | null {
    if (!asset.warranty_expiration) return null;
    const expiry = new Date(asset.warranty_expiration);
    const today = new Date();
    const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) return { label: 'Garantía vencida', daysRemaining, status: 'expired' };
    if (daysRemaining <= 30) return { label: `Vence en ${daysRemaining} días`, daysRemaining, status: 'expiring' };
    return { label: `${daysRemaining} días restantes`, daysRemaining, status: 'ok' };
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ─── QR Code Component ────────────────────────────────────────────────────────

function QRCodeDisplay({ value, size = 128 }: { value: string; size?: number }) {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        import('qrcode').then((QRCode) => {
            QRCode.toDataURL(value, { width: size, margin: 1 }).then((url) => {
                if (!cancelled) setQrDataUrl(url);
            });
        });
        return () => { cancelled = true; };
    }, [value, size]);

    if (!qrDataUrl) {
        return (
            <div
                className="bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse flex items-center justify-center"
                style={{ width: size, height: size }}
                aria-label="Cargando código QR"
            >
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
        );
    }

    return (
        <img
            src={qrDataUrl}
            alt={`Código QR para activo ${value}`}
            width={size}
            height={size}
            className="rounded-xl border border-slate-200 dark:border-slate-700"
        />
    );
}

// ─── Maintenance Section ───────────────────────────────────────────────────────

interface MaintenanceSectionProps {
    assetId: string;
}

function MaintenanceSection({ assetId }: MaintenanceSectionProps) {
    const { toast } = useToast();
    const [records, setRecords] = useState<MaintenanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        description: '',
        type: 'preventivo' as MaintenanceType,
        cost: '',
        date: new Date().toISOString().split('T')[0],
        completed: false,
    });

    const fetchRecords = useCallback(async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('asset_maintenance')
            .select('*')
            .eq('asset_id', assetId)
            .order('date', { ascending: false });

        if (!error && data) setRecords(data);
        setLoading(false);
    }, [assetId]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.description.trim()) return;
        setSaving(true);
        try {
            const supabase = createClient();
            const { error } = await supabase.from('asset_maintenance').insert({
                asset_id: assetId,
                description: form.description,
                type: form.type,
                cost: form.cost ? parseFloat(form.cost) : null,
                date: form.date,
                completed: form.completed,
            });
            if (error) throw error;
            toast('Mantenimiento registrado', 'success');
            setForm({ description: '', type: 'preventivo', cost: '', date: new Date().toISOString().split('T')[0], completed: false });
            setShowForm(false);
            await fetchRecords();
        } catch {
            toast('Error al guardar el mantenimiento', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section aria-labelledby="maintenance-heading" className="card-premium p-6 space-y-5">
            <div className="flex items-center justify-between">
                <h2 id="maintenance-heading" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                    <WrenchIcon className="w-4 h-4 text-primary" />
                    Mantenimientos
                </h2>
                <button
                    onClick={() => setShowForm((v) => !v)}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/10"
                    aria-expanded={showForm}
                    aria-controls="maintenance-form"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo
                </button>
            </div>

            {showForm && (
                <form
                    id="maintenance-form"
                    onSubmit={handleSubmit}
                    className="border border-primary/20 rounded-2xl p-5 space-y-4 bg-primary/5 animate-in fade-in duration-200"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                Descripcion
                            </label>
                            <input
                                type="text"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="input-premium"
                                placeholder="Limpieza, reemplazo de piezas..."
                                required
                                aria-label="Descripcion del mantenimiento"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                Tipo
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as MaintenanceType })}
                                className="input-premium appearance-none"
                                aria-label="Tipo de mantenimiento"
                            >
                                <option value="preventivo">Preventivo</option>
                                <option value="correctivo">Correctivo</option>
                                <option value="mejora">Mejora</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                Costo (COP)
                            </label>
                            <input
                                type="number"
                                value={form.cost}
                                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                className="input-premium"
                                placeholder="0"
                                min="0"
                                aria-label="Costo del mantenimiento"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="input-premium"
                                aria-label="Fecha del mantenimiento"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-5">
                            <input
                                type="checkbox"
                                id="completed"
                                checked={form.completed}
                                onChange={(e) => setForm({ ...form, completed: e.target.checked })}
                                className="w-4 h-4 accent-primary"
                            />
                            <label htmlFor="completed" className="text-xs font-black uppercase tracking-widest text-muted-foreground cursor-pointer">
                                Completado
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-[2] py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Guardar
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <WrenchIcon className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sin registros de mantenimiento</p>
                </div>
            ) : (
                <ul className="space-y-3" role="list" aria-label="Lista de mantenimientos">
                    {records.map((rec) => (
                        <li key={rec.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className={`mt-0.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${maintenanceTypeColors[rec.type]}`}>
                                {rec.type}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground">{rec.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(rec.date)}
                                    </span>
                                    {rec.cost !== null && (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <DollarSign className="w-3 h-3" />
                                            {formatCurrency(rec.cost)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div aria-label={rec.completed ? 'Completado' : 'Pendiente'}>
                                {rec.completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                ) : (
                                    <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

// ─── Movement History Section ──────────────────────────────────────────────────

interface MovementHistorySectionProps {
    assetId: string;
}

function MovementHistorySection({ assetId }: MovementHistorySectionProps) {
    const [history, setHistory] = useState<AssetHistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('asset_history')
                .select(`
                    *,
                    from_user:profiles!asset_history_from_user_id_fkey(full_name),
                    to_user:profiles!asset_history_to_user_id_fkey(full_name)
                `)
                .eq('asset_id', assetId)
                .order('created_at', { ascending: false });

            if (!error && data) setHistory(data as AssetHistoryRecord[]);
            setLoading(false);
        };
        fetchHistory();
    }, [assetId]);

    return (
        <section aria-labelledby="history-heading" className="card-premium p-6 space-y-5">
            <h2 id="history-heading" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                <Activity className="w-4 h-4 text-primary" />
                Historial de Movimientos
            </h2>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Activity className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sin historial de movimientos</p>
                </div>
            ) : (
                <ol className="relative space-y-0" aria-label="Historial de movimientos">
                    {history.map((entry, idx) => (
                        <li key={entry.id} className="flex gap-4 group">
                            {/* Timeline line */}
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
                                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                                </div>
                                {idx < history.length - 1 && (
                                    <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" aria-hidden="true" />
                                )}
                            </div>

                            {/* Entry content */}
                            <div className="pb-6 flex-1">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <p className="text-sm font-bold text-foreground">{entry.action}</p>
                                    <time
                                        dateTime={entry.created_at}
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 shrink-0"
                                    >
                                        {formatDate(entry.created_at)}
                                    </time>
                                </div>

                                {(entry.from_user || entry.to_user) && (
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                        {entry.from_user && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {entry.from_user.full_name}
                                            </span>
                                        )}
                                        {entry.from_user && entry.to_user && (
                                            <ArrowRight className="w-3 h-3" aria-hidden="true" />
                                        )}
                                        {entry.to_user && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {entry.to_user.full_name}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {entry.notes && (
                                    <p className="mt-1 text-xs text-muted-foreground italic">{entry.notes}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AssetDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { toast } = useToast();

    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchAsset = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('assets')
            .select('*, entity:entities(name), assignee:profiles(full_name)')
            .eq('id', id)
            .single();

        if (error || !data) {
            setNotFound(true);
        } else {
            setAsset(data as Asset);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { fetchAsset(); }, [fetchAsset]);

    const handleSave = async (data: AssetFormData) => {
        try {
            const updated = await assetService.updateAsset(id, data);
            setAsset(updated);
            toast('Activo actualizado correctamente', 'success');
        } catch {
            toast('Error al actualizar el activo', 'error');
            throw new Error('Update failed');
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" role="status" aria-live="polite">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Cargando activo...</p>
            </div>
        );
    }

    // ── Not found state ──
    if (notFound || !asset) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" role="alert">
                <XCircle className="w-16 h-16 text-rose-400" />
                <h1 className="text-2xl font-black text-foreground">Activo no encontrado</h1>
                <p className="text-muted-foreground text-sm">El activo con ID "{id}" no existe o no tienes acceso.</p>
                <Link
                    href="/inventario"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Inventario
                </Link>
            </div>
        );
    }

    // ── Derived values ──
    const CategoryIcon = categoryIcons[asset.category] || Box;
    const currentValue = calculateCurrentValue(asset);
    const warrantyInfo = getWarrantyInfo(asset);
    const assetUrl = typeof window !== 'undefined' ? window.location.href : `activo/${asset.id}`;

    return (
        <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-300">

            {/* ── Page Header ── */}
            <header className="flex items-start gap-4 flex-wrap">
                <Link
                    href="/inventario"
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    aria-label="Volver al inventario"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Inventario
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                            <CategoryIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">{asset.name}</h1>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{asset.category}</span>
                                {asset.serial_number && (
                                    <>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/40" aria-hidden="true" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1">
                                            <Hash className="w-3 h-3" aria-hidden="true" />
                                            {asset.serial_number}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${statusColors[asset.status]}`}>
                            {asset.status}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => generateAssetReceipt(asset)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-muted-foreground hover:text-foreground"
                        aria-label="Descargar acta de entrega en PDF"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden sm:inline">Acta PDF</span>
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-primary text-white hover:opacity-90 transition-all"
                        aria-label="Editar activo"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar</span>
                    </button>
                </div>
            </header>

            {/* ── Main Layout: 2-column ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Left Column (2/3) ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Asset Info Card */}
                    <section aria-labelledby="info-heading" className="card-premium p-6 space-y-5">
                        <h2 id="info-heading" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                            <Package className="w-4 h-4 text-primary" />
                            Informacion del Activo
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoRow icon={<MapPin />} label="Ubicacion" value={asset.location || 'Sin ubicacion'} />
                            <InfoRow icon={<Building2 />} label="Entidad" value={asset.entity?.name || 'Global'} />
                            <InfoRow icon={<Hash />} label="Serial" value={asset.serial_number || 'Sin serial'} />
                            <InfoRow icon={<Box />} label="Categoria" value={asset.category} />
                            {asset.notes && (
                                <div className="sm:col-span-2">
                                    <InfoRow icon={<FileText />} label="Notas" value={asset.notes} />
                                </div>
                            )}
                        </dl>
                    </section>

                    {/* Financial Card */}
                    <section aria-labelledby="financial-heading" className="card-premium p-6 space-y-5">
                        <h2 id="financial-heading" className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-foreground">
                            <DollarSign className="w-4 h-4 text-primary" />
                            Informacion Financiera
                        </h2>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {asset.purchase_value !== null && (
                                <InfoRow
                                    icon={<DollarSign />}
                                    label="Valor de Compra"
                                    value={formatCurrency(asset.purchase_value)}
                                />
                            )}
                            {asset.purchase_date && (
                                <InfoRow
                                    icon={<Calendar />}
                                    label="Fecha de Compra"
                                    value={formatDate(asset.purchase_date)}
                                />
                            )}
                            <InfoRow
                                icon={<TrendingDown />}
                                label="Tasa de Depreciacion"
                                value={`${asset.depreciation_rate}% anual`}
                            />
                            <InfoRow
                                icon={<Clock />}
                                label="Vida Util"
                                value={`${asset.useful_life_years} anos`}
                            />
                            {currentValue !== null && (
                                <div className="sm:col-span-2 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                    <dt className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600/70 mb-1">
                                        Valor Depreciado Actual
                                    </dt>
                                    <dd className="text-2xl font-black text-emerald-600 tracking-tight">
                                        {formatCurrency(currentValue)}
                                    </dd>
                                    {asset.purchase_value && (
                                        <p className="text-[10px] text-emerald-600/60 mt-1 font-medium">
                                            Depreciado {Math.round(((asset.purchase_value - currentValue) / asset.purchase_value) * 100)}% del valor original
                                        </p>
                                    )}
                                </div>
                            )}
                            {warrantyInfo && (
                                <div className="sm:col-span-2">
                                    <WarrantyBadge info={warrantyInfo} expirationDate={asset.warranty_expiration!} />
                                </div>
                            )}
                        </dl>
                    </section>

                    {/* Maintenance Records */}
                    <MaintenanceSection assetId={asset.id} />

                    {/* Movement History */}
                    <MovementHistorySection assetId={asset.id} />
                </div>

                {/* ── Right Sidebar (1/3) ── */}
                <aside className="space-y-5" aria-label="Informacion lateral del activo">

                    {/* Status Card */}
                    <div className="card-premium p-5 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estado Actual</h3>
                        <div className={`w-full py-3 px-4 rounded-2xl text-center text-sm font-black uppercase tracking-widest border ${statusColors[asset.status]}`}>
                            {asset.status}
                        </div>
                    </div>

                    {/* Assignee Card */}
                    <div className="card-premium p-5 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Asignado A</h3>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0"
                                aria-hidden="true"
                            >
                                <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground">
                                    {asset.assignee?.full_name || 'Sin asignar'}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Funcionario</p>
                            </div>
                        </div>
                    </div>

                    {/* Entity Card */}
                    <div className="card-premium p-5 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Entidad</h3>
                        <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="text-sm font-black text-foreground">{asset.entity?.name || 'Global'}</span>
                        </div>
                    </div>

                    {/* Location Card */}
                    <div className="card-premium p-5 space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ubicacion</h3>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="text-sm font-black text-foreground">{asset.location || 'Sin ubicacion'}</span>
                        </div>
                    </div>

                    {/* QR Code Card */}
                    <div className="card-premium p-5 space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Codigo QR</h3>
                        <div className="flex justify-center">
                            <QRCodeDisplay value={assetUrl} size={160} />
                        </div>
                        <p className="text-[9px] text-center text-muted-foreground/50 font-medium">
                            Escanea para ver este activo
                        </p>
                        <button
                            onClick={() => window.print()}
                            className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-muted-foreground hover:text-foreground"
                            aria-label="Imprimir codigo QR"
                        >
                            Imprimir QR
                        </button>
                    </div>

                    {/* Warranty Card */}
                    {warrantyInfo && (
                        <div className="card-premium p-5 space-y-3">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Garantia</h3>
                            <WarrantyBadge info={warrantyInfo} expirationDate={asset.warranty_expiration!} compact />
                        </div>
                    )}
                </aside>
            </div>

            {/* ── Edit Modal ── */}
            <AssetModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSave}
                asset={asset}
            />
        </div>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/5 mt-0.5" aria-hidden="true">
                <div className="text-muted-foreground">
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })}
                </div>
            </div>
            <div>
                <dt className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-0.5">{label}</dt>
                <dd className="text-sm font-bold text-foreground">{value}</dd>
            </div>
        </div>
    );
}

interface WarrantyBadgeProps {
    info: { label: string; daysRemaining: number; status: 'ok' | 'expiring' | 'expired' };
    expirationDate: string;
    compact?: boolean;
}

function WarrantyBadge({ info, expirationDate, compact = false }: WarrantyBadgeProps) {
    const Icon = info.status === 'expired' ? ShieldAlert : info.status === 'expiring' ? AlertTriangle : ShieldCheck;
    const colorClass = info.status === 'expired'
        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
        : info.status === 'expiring'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

    return (
        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${colorClass}`} role="status" aria-label={`Estado de garantia: ${info.label}`}>
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <div>
                <p className="text-xs font-black">{info.label}</p>
                {!compact && (
                    <p className="text-[10px] opacity-70 mt-0.5">Vence: {formatDate(expirationDate)}</p>
                )}
            </div>
        </div>
    );
}
