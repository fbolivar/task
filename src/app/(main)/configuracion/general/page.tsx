'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Save, Upload, RefreshCw } from 'lucide-react';

export default function GeneralSettingsPage() {
    const settings = useSettings();
    const [formData, setFormData] = useState({
        app_name: settings.app_name,
        header_color: settings.header_color,
        footer_text: settings.footer_text,
        logo_url: settings.logo_url
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // File input ref
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
            // Upload
            const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('assets')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, logo_url: publicUrl }));
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Error al subir el logo. Verifica permisos de Storage.');
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
                    id: 1, // Singleton ID
                    ...formData,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            // Force reload to apply changes globally immediately (or rely on realtime if enabled)
            window.location.reload();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error guardando configuración');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Configuración General
                </h1>
                <p className="text-muted-foreground mt-1">Personaliza la identidad visual de tu aplicación</p>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Branding Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            Identidad
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">Visible en toda la app</span>
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
                            <label className="block text-sm font-medium mb-1">Texto del Pie de Página (Footer)</label>
                            <input
                                type="text"
                                value={formData.footer_text}
                                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                                className="input w-full"
                                placeholder="Ej: © 2026 Reservados todos los derechos"
                            />
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <h2 className="text-xl font-semibold">Apariencia</h2>

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
                                    <p className="text-sm font-medium">{formData.header_color.toUpperCase()}</p>
                                    <p className="text-xs text-muted-foreground">Color usado en barra lateral y botones principales</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logo Section */}
                <div className="md:col-span-1">
                    <div className="glass-card p-6 h-full flex flex-col items-center text-center">
                        <h2 className="text-xl font-semibold mb-6">Logotipo</h2>

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

                {/* Actions */}
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
        </div>
    );
}
