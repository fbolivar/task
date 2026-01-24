'use client';

import { useState, useEffect } from 'react';
import { X, Save, Mail, Key, Eye, EyeOff, CheckCircle2, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';
import { Integration } from '../types';
import { integrationService } from '../services/integrationService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    integration: Integration | null;
    onSuccess: () => void;
}

export function GmailModal({ isOpen, onClose, integration, onSuccess }: Props) {
    const [email, setEmail] = useState('');
    const [appPassword, setAppPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if (integration && integration.config) {
            setEmail(integration.config.email || '');
            setAppPassword(integration.config.app_password || '');
        }
    }, [integration]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!integration) return;

        setLoading(true);
        try {
            await integrationService.saveGmailConfig(integration.id, {
                email,
                app_password: appPassword,
                smtp_host: 'smtp.gmail.com',
                smtp_port: 587
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        try {
            await integrationService.testGmailConnection({
                email,
                appPassword,
                to: testEmail
            });
            alert('¡Conexión exitosa! Correo de prueba enviado.');
        } catch (error: any) {
            console.error('Error testing connection:', error);
            alert('Error en la conexión: ' + error.message);
        } finally {
            setTesting(false);
        }
    };

    if (!isOpen || !integration) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-border bg-gradient-to-r from-red-500/10 to-transparent flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-foreground">Configurar Gmail</h2>
                            <p className="text-muted-foreground text-sm font-medium">Envío de correos automáticos y notificaciones</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Panel: Instructions */}
                    <div className="w-full md:w-2/5 bg-muted/30 p-8 border-r border-border space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Paso a Paso Seguro
                        </h3>

                        <div className="space-y-4">
                            <Step number={1} text="Ingresa a tu cuenta de Google y ve a 'Gestionar tu cuenta de Google'." />
                            <Step number={2} text="Ve a Seguridad > Verificación en 2 pasos (debe estar activada)." />
                            <Step number={3} text="En Seguridad, busca 'Contraseñas de aplicaciones'." />
                            <Step number={4} text="Crea una nueva app llamada 'GestorPro' y copia la contraseña de 16 caracteres generada." />
                        </div>

                        <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <div className="flex gap-3">
                                <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                    No uses tu contraseña personal. Google requiere una <strong>Contraseña de Aplicación</strong> única para integraciones externas seguras.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <form onSubmit={handleSubmit} className="flex-1 p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-muted/20 border border-border rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                                        placeholder="usuario@empresa.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Contraseña de Aplicación</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={appPassword}
                                        onChange={(e) => setAppPassword(e.target.value)}
                                        className="w-full bg-muted/20 border border-border rounded-xl pl-11 pr-12 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                                        placeholder="xxxx xxxx xxxx xxxx"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Test Connection Section */}
                            <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-3 mt-4">
                                <h4 className="text-xs font-black uppercase text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Probar Conexión
                                </h4>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="Enviar correo de prueba a..."
                                        className="flex-1 bg-white dark:bg-black border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleTestConnection}
                                        disabled={testing || !email || !appPassword || !testEmail}
                                        className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-black uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
                                    >
                                        {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Probar'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !email || !appPassword}
                                className="bg-red-500 text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Conectando...' : <><CheckCircle2 className="w-4 h-4" /> Guardar y Activar</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Step({ number, text }: { number: number, text: string }) {
    return (
        <div className="flex gap-4 items-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0 border border-primary/20">
                {number}
            </div>
            <p className="text-xs text-foreground/80 font-medium leading-relaxed">{text}</p>
        </div>
    );
}
