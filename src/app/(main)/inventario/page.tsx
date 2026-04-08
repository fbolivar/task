'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { AssetHeader } from '@/features/assets/components/AssetHeader';
import { AssetCard } from '@/features/assets/components/AssetCard';
import { AssetModal } from '@/features/assets/components/AssetModal';
import { AssetDashboard } from '@/features/assets/components/AssetDashboard';
import { AssetBulkBar } from '@/features/assets/components/AssetBulkBar';
import { Asset, AssetFormData, AssetCategory, AssetStatus } from '@/features/assets/types';
import { assetService } from '@/features/assets/services/assetService';
import { Loader2, Package, Plus, Sparkles } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useToast } from '@/shared/components/Toast';

export default function InventarioPage() {
    const { t } = useSettings();
    const { toast } = useToast();
    const { assets, loading, createAsset, updateAsset, deleteAsset, refresh } = useAssets();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'All'>('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    // Bulk selection state
    const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch =
                asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.location?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
            const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [assets, searchTerm, categoryFilter, statusFilter]);

    const handleOpenCreateModal = () => {
        setEditingAsset(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (asset: Asset) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleSave = async (data: AssetFormData) => {
        if (editingAsset) {
            await updateAsset(editingAsset.id, data);
        } else {
            await createAsset(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm(t('general.delete') + '?')) {
            await deleteAsset(id);
        }
    };

    // Bulk handlers
    const handleToggleSelect = useCallback((id: string) => {
        setSelectedAssets((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const handleBulkChangeStatus = useCallback(async (status: AssetStatus) => {
        const ids = Array.from(selectedAssets);
        try {
            await Promise.all(ids.map((id) => assetService.updateAsset(id, { status })));
            await refresh();
            toast(`Estado actualizado a "${status}" en ${ids.length} activo${ids.length !== 1 ? 's' : ''}`, 'success');
            setSelectedAssets(new Set());
        } catch {
            toast('Error al actualizar el estado de los activos', 'error');
        }
    }, [selectedAssets, toast, refresh]);

    const handleExportSelected = useCallback(() => {
        const selectedList = assets.filter((a) => selectedAssets.has(a.id));
        if (selectedList.length === 0) return;

        const headers = ['Nombre', 'Serial', 'Categoría', 'Estado', 'Ubicación', 'Asignado A', 'Valor Compra', 'Garantía Hasta'];
        const rows = selectedList.map((a) => [
            a.name,
            a.serial_number ?? '',
            a.category,
            a.status,
            a.location ?? '',
            a.assignee?.full_name ?? '',
            a.purchase_value != null ? String(a.purchase_value) : '',
            a.warranty_expiration ?? '',
        ]);

        const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
        const csvContent = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\r\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `activos-seleccionados-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast(`${selectedList.length} activo${selectedList.length !== 1 ? 's' : ''} exportado${selectedList.length !== 1 ? 's' : ''} correctamente`, 'success');
    }, [assets, selectedAssets, toast]);

    const handleExport = useCallback(() => {
        const headers = ['Nombre', 'Serial', 'Categoría', 'Estado', 'Ubicación', 'Asignado A', 'Valor Compra', 'Garantía Hasta'];
        const rows = filteredAssets.map(a => [
            a.name,
            a.serial_number ?? '',
            a.category,
            a.status,
            a.location ?? '',
            a.assignee?.full_name ?? '',
            a.purchase_value != null ? String(a.purchase_value) : '',
            a.warranty_expiration ?? '',
        ]);

        const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
        const csvContent = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\r\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inventario-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [filteredAssets]);

    if (loading && assets.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-reveal">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="relative w-16 h-16 text-primary animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mb-2">Scanning Resources</p>
                <p className="text-muted-foreground font-black text-sm uppercase tracking-widest">{t('general.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <AssetHeader
                onSearch={setSearchTerm}
                onNewAsset={handleOpenCreateModal}
                categoryFilter={categoryFilter}
                onCategoryChange={setCategoryFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                onExport={handleExport}
            />

            <AssetDashboard assets={assets} />

            {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal">
                    {filteredAssets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                            isSelected={selectedAssets.has(asset.id)}
                            onToggleSelect={handleToggleSelect}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 card-premium border-dashed border-2 border-slate-200 dark:border-white/10 group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-slate-100 dark:border-white/5">
                            <Package className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Resource Intelligence</span>
                    </div>

                    <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 transition-colors group-hover:text-primary">
                        {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All' ? t('inventory.emptySearch') : 'Inventario Vacío'}
                    </h3>

                    <p className="text-muted-foreground font-medium text-center max-w-sm mb-10 leading-relaxed">
                        {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All'
                            ? t('inventory.emptySearchDesc')
                            : t('inventory.emptyDesc')}
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn-primary group/btn"
                    >
                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('inventory.createFirst')}</span>
                    </button>
                </div>
            )}

            <AssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                asset={editingAsset}
            />

            <AssetBulkBar
                selectedCount={selectedAssets.size}
                onChangeStatus={handleBulkChangeStatus}
                onExportSelected={handleExportSelected}
                onClearSelection={() => setSelectedAssets(new Set())}
            />
        </div>
    );
}
