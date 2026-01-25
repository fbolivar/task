'use client';

import { useState } from 'react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { Mail, Bell, Save, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function TemplatesPage() {
    const { t } = useSettings();
    const [activeTab, setActiveTab] = useState<'email' | 'alerts'>('email');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-xl font-black text-foreground">Plantillas de Comunicación</h2>
                <p className="text-muted-foreground text-sm font-medium">Personaliza los correos y alertas automáticas del sistema</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('email')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'email'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <Mail className="w-4 h-4" />
                    Correos Electrónicos
                </button>
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'alerts'
                        ? 'text-primary border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                        }`}
                >
                    <Bell className="w-4 h-4" />
                    Alertas del Sistema
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Template List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-4 space-y-2">
                        <h3 className="text-xs font-black uppercase text-muted-foreground mb-4">Disponibles</h3>
                        {activeTab === 'email' ? (
                            <>
                                <TemplateItem title="Bienvenida Usuario" active />
                                <TemplateItem title="Recuperar Contraseña" active />
                                <TemplateItem title="Notificación de Tarea" active />
                                <TemplateItem title="Reporte Mensual" />
                            </>
                        ) : (
                            <>
                                <TemplateItem title="Tarea Vencida" active />
                                <TemplateItem title="Presupuesto Crítico" active />
                                <TemplateItem title="Cambio de Estado" active />
                            </>
                        )}
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Bienvenida Usuario
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase">Activo</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Asunto</label>
                                <input
                                    type="text"
                                    defaultValue="Bienvenido a {{app_name}}"
                                    className="input-premium w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-muted-foreground mb-1.5">Contenido (HTML)</label>
                                <textarea
                                    className="input-premium w-full min-h-[300px] font-mono text-xs leading-relaxed"
                                    defaultValue={`<h1>¡Hola {{user_name}}!</h1>
<p>Bienvenido al ecosistema <strong>{{app_name}}</strong>.</p>
<p>Tus credenciales de acceso son:</p>
<ul>
    <li>Email: {{user_email}}</li>
    <li>Rol: {{user_role}}</li>
</ul>
<p>Para comenzar, haz clic en el siguiente botón:</p>
<a href="{{login_url}}" class="btn">Ingresar al Sistema</a>`}
                                />
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end">
                                <button className="btn-primary flex items-center gap-2">
                                    <Save className="w-4 h-4" />
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-600">Variables Disponibles</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Usa <code>{`{{variable}}`}</code> para insertar contenido dinámico:
                                <span className="font-mono ml-1">app_name, user_name, user_email, login_url</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TemplateItem({ title, active = false }: { title: string, active?: boolean }) {
    return (
        <div className={`p-3 rounded-xl border cursor-pointer transition-all ${active
            ? 'bg-primary/5 border-primary/20 shadow-sm'
            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}>
            <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${active ? 'text-primary' : 'text-foreground'}`}>{title}</span>
                {active && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
            </div>
        </div>
    );
}
