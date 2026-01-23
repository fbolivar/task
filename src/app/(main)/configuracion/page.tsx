'use client';

import { useState, useRef } from 'react';
import { Settings, ShieldAlert, History, Save, Upload, RefreshCw } from 'lucide-react';
import { ThresholdSettings } from '@/features/entities/components/ThresholdSettings';
import { ReassignmentAuditPanel } from '@/features/entities/components/ReassignmentAuditPanel';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';

type TabKey = 'general' | 'politicas' | 'auditoria';

export default function ConfiguracionPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('general');

    const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
        { key: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
        { key: 'politicas', label: 'Políticas de Riesgo', icon: <ShieldAlert className="w-4 h-4" /> },
        { key: 'auditoria', label: 'Log de Auditoría', icon: <History className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight">
                    Configuración del Sistema
                </h1>
                <p className="text-muted-foreground mt-1">Administra la identidad, políticas de riesgo y auditoría del ecosistema</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-md'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'politicas' && <ThresholdSettings />}
                {activeTab === 'auditoria' && <ReassignmentAuditPanel />}
            </div>
        </div>
    );
}

function GeneralSettings() {
    const settings = useSettings();
    const [formData, setFormData] = useState({
        app_name: settings.app_name,
        header_color: settings.header_color,
        footer_text: settings.footer_text,
        logo_url: settings.logo_url
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `logo_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error al subir el logo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    id: 1,
                    ...formData,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            window.location.reload();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error guardando configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-2 uppercase tracking-tight">
                        Identidad
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full normal-case tracking-normal">Visible en toda la app</span>
                    </h2>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nombre de la Aplicación</label>
                        <input
                            type="text"
                            value={formData.app_name}
                            onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                            className="input w-full"
                            placeholder="Ej: Mi Empresa ERP"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Texto del Pie de Página</label>
                        <input
                            type="text"
                            value={formData.footer_text}
                            onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                            className="input w-full"
                            placeholder="Ej: © 2026 Todos los derechos reservados"
                        />
                    </div>
                </div>

                <div className="glass-card p-6 space-y-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">Apariencia</h2>
                    <div>
                        <label className="block text-sm font-medium mb-3">Color Principal (Header & Acentos)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={formData.header_color}
                                onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                                className="w-16 h-16 p-1 rounded-xl cursor-pointer bg-transparent border border-border"
                            />
                            <div className="space-y-1">
                                <p className="text-sm font-bold">{formData.header_color.toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground">Usado en sidebar y botones principales</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:col-span-1">
                <div className="glass-card p-6 h-full flex flex-col items-center text-center">
                    <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Logotipo</h2>
                    <div
                        className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-6 overflow-hidden relative group bg-muted/20"
                        style={{ borderColor: formData.header_color }}
                    >
                        {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                        ) : (
                            <span className="text-4xl font-bold text-muted-foreground opacity-20">{formData.app_name.charAt(0)}</span>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-medium">Click para cambiar</p>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    <div className="space-y-2 w-full">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="btn-secondary w-full text-xs"
                        >
                            {uploading ? 'Subiendo...' : 'Subir Nueva Imagen'} <Upload className="w-3 h-3 ml-2" />
                        </button>
                        <p className="text-[10px] text-muted-foreground">Recomendado: PNG transparente, 512x512px</p>
                    </div>
                </div>
            </div>

            <div className="md:col-span-3 flex justify-end pt-4 border-t border-border">
                <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 px-8"
                    style={{ backgroundColor: formData.header_color }}
                >
                    {saving ? (
                        <>Guardando <RefreshCw className="w-4 h-4 animate-spin" /></>
                    ) : (
                        <>Guardar Cambios <Save className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </form>
    );
}
