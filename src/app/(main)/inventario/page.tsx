'use client';

import { useState, useMemo } from 'react';
import { useAssets } from '@/features/assets/hooks/useAssets';
import { AssetHeader } from '@/features/assets/components/AssetHeader';
import { AssetCard } from '@/features/assets/components/AssetCard';
import { AssetModal } from '@/features/assets/components/AssetModal';
import { Asset, AssetFormData, AssetCategory } from '@/features/assets/types';
import { Loader2, Package } from 'lucide-react';

export default function InventarioPage() {
    const { assets, loading, createAsset, updateAsset, deleteAsset } = useAssets();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'All'>('All');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch =
                asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.location?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [assets, searchTerm, categoryFilter]);

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
        if (window.confirm('¿Estás seguro de eliminar este activo del inventario? Esta acción es irreversible.')) {
            await deleteAsset(id);
        }
    };

    if (loading && assets.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-black tracking-widest uppercase text-xs">Escaneando Activos...</p>
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
            />

            {filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {filteredAssets.map((asset) => (
                        <AssetCard
                            key={asset.id}
                            asset={asset}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 glass-card border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Sin resultados coincidentes</h3>
                    <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm font-medium">
                        {searchTerm || categoryFilter !== 'All'
                            ? 'No encontramos activos que coincidan con los criterios de búsqueda actuales.'
                            : 'El inventario está vacío. Comienza a registrar tus activos corporativos ahora mismo.'}
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary px-10 py-3"
                    >
                        Registrar Primer Activo
                    </button>
                </div>
            )}

            <AssetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                asset={editingAsset}
            />
        </div>
    );
}
