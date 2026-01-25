'use client';

import { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, HelpCircle, Loader2, HardDrive, ArrowRight } from 'lucide-react';
import { Integration } from '../types';
import { integrationService } from '../services/integrationService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    integration: Integration | null;
    onSuccess: () => void;
}

export function DriveModal({ isOpen, onClose, integration, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    if (!isOpen || !integration) return null;

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Mock connection delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Bypass backend for mock integration
            if (integration.id !== 'drive-001') {
                await integrationService.saveGmailConfig(integration.id, {
                    connected: true,
                    folder_id: 'root',
                    access_token: 'mock_token_' + Date.now()
                });
            }

            onSuccess();
            setStep(2);
            setTimeout(onClose, 2000);
        } catch (error) {
            console.error('Error connecting Drive:', error);
            // alert('Error al conectar con Google Drive'); // Avoid alerts
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-border bg-gradient-to-r from-blue-500/10 to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">Conectar Google Drive</h2>
                            <p className="text-muted-foreground text-sm font-medium">Almacenamiento seguro de actas y evidencias</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Panel: Info */}
                    <div className="w-full md:w-2/5 bg-muted/30 p-8 border-r border-border space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Privacidad y Datos
                        </h3>

                        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                            <p>GestorPro solicitará acceso para:</p>
                            <ul className="space-y-2 list-disc pl-4">
                                <li><strong>Crear carpetas</strong> automáticas por Proyecto.</li>
                                <li><strong>Subir archivos</strong> (Actas, Fotos, PDFs).</li>
                                <li><strong>Leer metadatos</strong> de los archivos subidos.</li>
                            </ul>
                            <p className="pt-2 italic">No leeremos ni modificaremos tus archivos personales existentes.</p>
                        </div>

                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <div className="flex gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    Usamos el protocolo seguro <strong>OAuth 2.0</strong> de Google.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Action */}
                    <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-8">
                        {step === 1 ? (
                            <>
                                <div className="p-6 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse">
                                    <HardDrive className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Listo para conectar</h3>
                                    <p className="text-sm text-muted-foreground mt-2 max-w-[280px] mx-auto">
                                        Serás redirigido a Google para autorizar el acceso a tu cuenta corporativa.
                                    </p>
                                </div>
                                <button
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="btn-primary w-full max-w-xs flex items-center justify-center gap-3 py-4 text-sm"
                                >
                                    {loading ? (
                                        <>Conectando <Loader2 className="w-4 h-4 animate-spin" /></>
                                    ) : (
                                        <>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="G" className="w-4 h-4" />
                                            Iniciar Sesión con Google
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold">¡Conexión Exitosa!</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
