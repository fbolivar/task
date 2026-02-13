'use client';

import { useState, useEffect } from 'react';
import { integrationService } from '@/features/integrations/services/integrationService';
import { Integration } from '@/features/integrations/types';
import { GmailModal } from '@/features/integrations/components/GmailModal';
import { DriveModal } from '@/features/integrations/components/DriveModal';
import { Loader2, Mail, CheckCircle2, XCircle, ChevronRight, Puzzle } from 'lucide-react';

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const data = await integrationService.getIntegrations();
            // Check if Google Drive integration already exists
            const hasDrive = data?.some(i => i.provider === 'google_drive');

            let allIntegrations = [...(data || [])];

            if (!hasDrive) {
                // Mock Google Drive for Phase 7 (First setup)
                const driveIntegration: Integration = {
                    id: 'drive-001',
                    name: 'Google Drive',
                    provider: 'google_drive',
                    is_active: false,
                    config: {},
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                allIntegrations.push(driveIntegration);
            }

            setIntegrations(allIntegrations);
        } catch (error) {
            console.error('Error fetching integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIntegrations();
    }, []);

    const handleConfigure = (integration: Integration) => {
        setSelectedIntegration(integration);
        setIsModalOpen(true);
    };

    const handleToggle = async (integration: Integration) => {
        try {
            const newState = !integration.is_active;
            await integrationService.toggleIntegration(integration.id, newState);
            setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, is_active: newState } : i));
        } catch (error) {
            console.error('Error toggling integration:', error);
            alert('Error al actualizar estado');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-foreground">Integraciones Disponibles</h2>
                    <p className="text-muted-foreground text-sm font-medium">Conecta GestorPro con tus herramientas favoritas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div
                        key={integration.id}
                        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl ${integration.is_active
                            ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-primary/20 shadow-primary/5'
                            : 'bg-white dark:bg-slate-900 border-border grayscale-[0.5] hover:grayscale-0'
                            }`}
                    >
                        {/* Status Indicator */}
                        <div className="absolute top-4 right-4">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${integration.is_active
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                }`}>
                                {integration.is_active ? (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Activo
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        Inactivo
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-8 pb-6">
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${integration.provider === 'gmail' ? 'bg-white' : 'bg-slate-100 dark:bg-slate-800'
                                }`}>
                                {integration.provider === 'gmail' && (
                                    <img
                                        src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
                                        alt="Gmail"
                                        className="w-10 h-10"
                                    />
                                )}
                                {integration.provider !== 'gmail' && <Puzzle className="w-8 h-8 text-muted-foreground" />}
                            </div>

                            <h3 className="text-xl font-black text-foreground mb-2">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground font-medium mb-6 min-h-[40px]">
                                {integration.provider === 'gmail'
                                    ? 'Automatiza el envío de notificaciones y reportes a través de tu cuenta corporativa.'
                                    : integration.provider === 'google_drive'
                                        ? 'Sincronización automática de actas y evidencias documentales.'
                                        : 'Integración genérica del sistema.'}
                            </p>

                            <div className="flex items-center gap-4 pt-6 border-t border-border/50">
                                <button
                                    onClick={() => {
                                        if (integration.provider === 'google_drive') {
                                            setSelectedIntegration(integration);
                                            setIsDriveModalOpen(true);
                                        } else {
                                            handleConfigure(integration);
                                        }
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase hover:bg-primary hover:text-white transition-all"
                                >
                                    {integration.provider === 'google_drive' ? 'Conectar' : 'Configurar'}
                                </button>

                                {integration.is_active && (
                                    <button
                                        onClick={() => handleToggle(integration)}
                                        className="py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all"
                                        title="Desactivar integración"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <GmailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                integration={selectedIntegration}
                onSuccess={fetchIntegrations}
            />

            <DriveModal
                isOpen={isDriveModalOpen}
                onClose={() => setIsDriveModalOpen(false)}
                integration={selectedIntegration}
                onSuccess={fetchIntegrations}
            />
        </div>
    );
}
