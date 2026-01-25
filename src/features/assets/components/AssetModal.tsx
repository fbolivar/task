'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    Package,
    Hash,
    Tag,
    MapPin,
    User,
    Calendar,
    Building2,
    DollarSign,
    FileText,
    Loader2,
    Info,
    ShieldCheck,
    Clock,
    TrendingDown
} from 'lucide-react';
import { Asset, AssetFormData, AssetCategory, AssetStatus } from '../types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSettings } from '@/shared/contexts/SettingsContext';

import { DeliveryActButton } from './DeliveryAct';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: AssetFormData) => Promise<void>;
    asset?: Asset | null;
}


const categories: AssetCategory[] = ['Hardware', 'Software', 'Mobiliario', 'Vehículo', 'Herramientas', 'General'];
const statuses: AssetStatus[] = ['Disponible', 'Asignado', 'Mantenimiento', 'Baja'];

const categoryKeyMap: Record<AssetCategory, string> = {
    'Hardware': 'inventory.cat.hardware',
    'Software': 'inventory.cat.software',
    'Mobiliario': 'inventory.cat.furniture',
    'Vehículo': 'inventory.cat.vehicle',
    'Herramientas': 'inventory.cat.tools',
    'General': 'inventory.cat.general'
};

const statusKeyMap: Record<AssetStatus, string> = {
    'Disponible': 'inventory.status.available',
    'Asignado': 'inventory.status.assigned',
    'Mantenimiento': 'inventory.status.maintenance',
    'Baja': 'inventory.status.discharged'
};

const initialFormData: AssetFormData = {
    name: '',
    category: 'General',
    status: 'Disponible',
    serial_number: '',
    purchase_date: null,
    purchase_value: null,
    entity_id: null,
    assigned_to: null,
    location: '',
    notes: '',
    warranty_expiration: null,
    useful_life_years: 5,
    depreciation_rate: 20,
};

export function AssetModal({ isOpen, onClose, onSave, asset }: AssetModalProps) {
    const { t } = useSettings();
    const [formData, setFormData] = useState<AssetFormData>(initialFormData);
    const [entities, setEntities] = useState<{ id: string, name: string }[]>([]);
    const [profiles, setProfiles] = useState<{ id: string, full_name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                category: asset.category,
                status: asset.status,
                serial_number: asset.serial_number || '',
                purchase_date: asset.purchase_date,
                purchase_value: asset.purchase_value,
                entity_id: asset.entity_id,
                assigned_to: asset.assigned_to,
                location: asset.location || '',
                notes: asset.notes || '',
                warranty_expiration: asset.warranty_expiration,
                useful_life_years: asset.useful_life_years || 5,
                depreciation_rate: asset.depreciation_rate || 20,
            });
        } else {
            setFormData({
                ...initialFormData,
                entity_id: activeEntityId || null
            });
        }
    }, [asset, activeEntityId, isOpen]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const supabase = createClient();
            const [entRes, profRes] = await Promise.all([
                supabase.from('entities').select('id, name'),
                supabase.from('profiles').select('id, full_name')
            ]);
            if (entRes.data) setEntities(entRes.data);
            if (profRes.data) setProfiles(profRes.data);
            setLoading(false);
        };
        if (isOpen) fetchData();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('Error al guardar el activo');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">


                {/* Header */}
                <div className="p-8 bg-gradient-to-br from-slate-800 to-black text-white relative">
                    <div className="absolute right-6 top-6 flex items-center gap-3">
                        {asset && <DeliveryActButton asset={asset} />}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl border-4 border-primary/30 flex items-center justify-center bg-slate-900 shadow-2xl">
                            <Package className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                {asset ? t('inventory.form.editTitle') : t('inventory.form.newTitle')}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-primary/30">
                                    Módulo Inventario V3
                                </span>
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {t('inventory.desc')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white dark:bg-slate-900">
                    <div className="space-y-8">
                        <SectionTitle title={t('inventory.form.identification')} />
                        <div className="space-y-4">
                            <FormField label={t('inventory.form.name')} icon={<Package />}>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-premium"
                                    placeholder="Ej: MacBok Pro M3 Max"
                                    required
                                />
                            </FormField>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField label={t('inventory.form.serial')} icon={<Hash />}>
                                    <input
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                        className="input-premium"
                                        placeholder="BC-99282"
                                    />
                                </FormField>
                                <FormField label={t('inventory.form.category')} icon={<Tag />}>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                                        className="input-premium appearance-none cursor-pointer"
                                        required
                                    >
                                        {categories.map(c => <option key={c} value={c}>{t(categoryKeyMap[c] as any)}</option>)}
                                    </select>
                                </FormField>
                            </div>

                            <FormField label={t('inventory.form.location')} icon={<MapPin />}>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="input-premium"
                                    placeholder="Ej: Oficina Central - Sala 4"
                                />
                            </FormField>
                        </div>

                        <SectionTitle title={t('inventory.form.assignment')} />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label={t('inventory.form.status')} icon={<Info />}>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                                        className="input-premium appearance-none cursor-pointer"
                                        required
                                    >
                                        {statuses.map(s => <option key={s} value={s}>{t(statusKeyMap[s] as any)}</option>)}
                                    </select>
                                </FormField>
                                <FormField label={t('inventory.form.assignedTo')} icon={<User />}>
                                    <select
                                        value={formData.assigned_to || ''}
                                        onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value || null })}
                                        className="input-premium appearance-none cursor-pointer"
                                    >
                                        <option value="">{t('general.none')}</option>
                                        {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </FormField>
                            </div>
                            <FormField label={t('entities.title')} icon={<Building2 />}>
                                <select
                                    value={formData.entity_id || ''}
                                    onChange={(e) => setFormData({ ...formData, entity_id: e.target.value || null })}
                                    className="input-premium appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">{t('general.none')}</option>
                                    {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </FormField>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <SectionTitle title={t('inventory.form.financial')} />
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label={t('inventory.form.purchaseDate')} icon={<Calendar />}>
                                    <input
                                        type="date"
                                        value={formData.purchase_date || ''}
                                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value || null })}
                                        className="input-premium"
                                    />
                                </FormField>
                                <FormField label={t('inventory.form.purchaseValue')} icon={<DollarSign />}>
                                    <input
                                        type="number"
                                        value={formData.purchase_value || ''}
                                        onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="input-premium"
                                        placeholder="0.00"
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <FormField label={t('inventory.form.warranty')} icon={<ShieldCheck />}>
                                    <input
                                        type="date"
                                        value={formData.warranty_expiration || ''}
                                        onChange={(e) => setFormData({ ...formData, warranty_expiration: e.target.value || null })}
                                        className="input-premium"
                                    />
                                </FormField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField label={t('inventory.form.lifeSpan')} icon={<Clock />}>
                                    <input
                                        type="number"
                                        value={formData.useful_life_years}
                                        onChange={(e) => setFormData({ ...formData, useful_life_years: parseInt(e.target.value) || 0 })}
                                        className="input-premium"
                                        min="1"
                                    />
                                </FormField>
                                <FormField label={t('inventory.form.depreciation')} icon={<TrendingDown />}>
                                    <input
                                        type="number"
                                        value={formData.depreciation_rate}
                                        onChange={(e) => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value) || 0 })}
                                        className="input-premium"
                                        step="0.01"
                                    />
                                </FormField>
                            </div>
                        </div>

                        <SectionTitle title={t('inventory.form.notes')} />
                        <FormField label={t('inventory.form.techNotes')} icon={<FileText />} alignIcon="top">
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="input-premium min-h-[150px] py-4"
                                placeholder="..."
                            />
                        </FormField>
                    </div>

                    <div className="md:col-span-2 flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            {t('general.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {asset ? t('general.save') : t('general.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-8 h-[2px] bg-primary/20" /> {title}
        </h4>
    );
}

function FormField({ label, icon, children, alignIcon = 'center' }: { label: string, icon: React.ReactNode, children: React.ReactNode, alignIcon?: 'center' | 'top' }) {
    const iconPos = alignIcon === 'top' ? 'top-4' : 'top-1/2 -translate-y-1/2';
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
            <div className="relative group">
                <div className={`absolute left-4 ${iconPos} text-muted-foreground group-focus-within:text-primary transition-colors`}>
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                </div>
                {children}
            </div>
        </div>
    );
}
