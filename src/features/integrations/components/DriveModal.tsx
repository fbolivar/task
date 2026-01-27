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
    const [jsonKey, setJsonKey] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [configType, setConfigType] = useState<'service_account' | 'oauth'>('service_account');

    if (!isOpen || !integration) return null;

    const handleConnect = async () => {
        if (!jsonKey.trim()) {
            alert('Por favor, pega el JSON de tu Service Account.');
            return;
        }

        setLoading(true);
        try {
            // Validate JSON
            let parsedKey;
            try {
                parsedKey = JSON.parse(jsonKey);
                if (!parsedKey.client_email || !parsedKey.private_key) {
                    throw new Error('El JSON no parece ser una llave de Service Account válida.');
                }
            } catch (e) {
                alert('El JSON es inválido.');
                setLoading(false);
                return;
            }

            // Save to DB
            const config = {
                type: 'service_account',
                client_email: parsedKey.client_email,
                private_key: parsedKey.private_key,
                project_id: parsedKey.project_id
            };

            // If we are creating a new integration logic (e.g. if it didn't exist in DB)
            // But here we rely on the ID being real. 
            // NOTE: In the page.tsx, we mocked the ID 'drive-001'. We need to ENSURE it exists in DB first.
            // Since we mocked it in fetchIntegrations, it might NOT exist in DB yet.
            // We should use integrationService to properly UPSERT it.

            // However, integrationService relies on an existing ID usually.
            // Let's assume for now we use the id if it exists, or create a new row if it matches the 'provider'.

            // Actually, we must check if the mocked integration has a real DB counterpart.
            // The Page.tsx mocked it. So `integration.id` might be 'drive-001' which is fake.

            // Let's try to update using provider = 'google_drive' if ID is fake.
            let realId = integration.id;

            if (realId === 'drive-001') {
                // It's a mock ID from the frontend. We need to FIND or CREATE the real integration row.
                // We'll handle this in the service call if possible, or just hack it here by 
                // calling a dedicated 'configureDrive' method.

                // Since I cannot change the service right now easily without context of "create", 
                // I will create a new method in integrationService "configureGoogleDrive(config)"
            }

            await integrationService.configureGoogleDrive(config);

            onSuccess();
            setStep(2);
            setTimeout(onClose, 2000);
        } catch (error) {
            console.error('Error connecting Drive:', error);
            alert('Error al guardar la configuración: ' + (error as any).message);
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
                            <p className="text-muted-foreground text-sm font-medium">Configuración de Service Account</p>
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
                            <ShieldCheck className="w-4 h-4" /> Instrucciones
                        </h3>

                        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                            <p>Para permitir que el sistema suba archivos, necesitamos una <strong>Service Account</strong>:</p>
                            <ol className="space-y-2 list-decimal pl-4">
                                <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" className="underline text-blue-500">Google Cloud Console</a>.</li>
                                <li>Crea un proyecto y habilita la <strong>Google Drive API</strong>.</li>
                                <li>Crea una Service Account y descarga la llave <strong>JSON</strong>.</li>
                                <li>Pega el contenido del JSON aquí.</li>
                            </ol>
                            <p className="pt-2 italic">Asegúrate de compartir la carpeta destino de Drive con el email de la Service Account.</p>
                        </div>
                    </div>

                    {/* Right Panel: Action */}
                    <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-6">
                        {step === 1 ? (
                            <>
                                <div className="w-full space-y-2 text-left">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Service Account JSON</label>
                                    <textarea
                                        value={jsonKey}
                                        onChange={(e) => setJsonKey(e.target.value)}
                                        placeholder='{ "type": "service_account", ... }'
                                        className="w-full h-40 text-[10px] font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-all resize-none"
                                    />
                                </div>
                                <button
                                    onClick={handleConnect}
                                    disabled={loading}
                                    className="btn-primary w-full flex items-center justify-center gap-3 py-3 text-sm"
                                >
                                    {loading ? (
                                        <>Guardando <Loader2 className="w-4 h-4 animate-spin" /></>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Guardar Configuración
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold">¡Configuración Guardada!</h3>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
