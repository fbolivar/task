import { useState, useEffect, useCallback } from 'react';
import { assetService } from '../services/assetService';
import { Asset, AssetFormData } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAssets() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchAssets = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await assetService.getAssets(activeEntityId);
            setAssets(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al cargar el inventario';
            if (message) {
                console.error('Error fetching assets:', message);
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [activeEntityId]);

    const createAsset = async (data: AssetFormData) => {
        try {
            const newAsset = await assetService.createAsset(data);
            setAssets(prev => [newAsset, ...prev]);
            return newAsset;
        } catch (err: any) {
            console.error('Error creating asset:', err);
            throw err;
        }
    };

    const updateAsset = async (id: string, data: Partial<AssetFormData>) => {
        try {
            const updated = await assetService.updateAsset(id, data);
            setAssets(prev => prev.map(a => a.id === id ? updated : a));
            return updated;
        } catch (err: any) {
            console.error('Error updating asset:', err);
            throw err;
        }
    };

    const deleteAsset = async (id: string) => {
        try {
            await assetService.deleteAsset(id);
            setAssets(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            console.error('Error deleting asset:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return {
        assets,
        loading,
        error,
        createAsset,
        updateAsset,
        deleteAsset,
        refresh: fetchAssets
    };
}
