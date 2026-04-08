'use client';

import { CheckCircle } from 'lucide-react';
import { ChangeRequestFormData } from '../types';
import { SectionTitle } from './form-primitives';

interface ChangeFormAssetsProps {
    formData: ChangeRequestFormData;
    onChange: (data: ChangeRequestFormData) => void;
    assets: { id: string; name: string }[];
}

export function ChangeFormAssets({ formData, onChange, assets }: ChangeFormAssetsProps) {
    const toggleAsset = (assetId: string) => {
        const isSelected = formData.asset_ids?.includes(assetId);
        const newAssets = isSelected
            ? formData.asset_ids?.filter(id => id !== assetId)
            : [...(formData.asset_ids || []), assetId];
        onChange({ ...formData, asset_ids: newAssets });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <SectionTitle>Activos Involucrados</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
                {assets.map(asset => {
                    const isSelected = formData.asset_ids?.includes(asset.id);
                    return (
                        <div
                            key={asset.id}
                            onClick={() => toggleAsset(asset.id)}
                            className={`
                                cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between
                                ${isSelected
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/50'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-slate-300'}`} />
                                <span className="text-sm font-medium truncate">{asset.name}</span>
                            </div>
                            {isSelected && <CheckCircle className="w-4 h-4" />}
                        </div>
                    );
                })}
            </div>
            {assets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                    No hay activos registrados en el inventario.
                </p>
            )}
        </div>
    );
}
