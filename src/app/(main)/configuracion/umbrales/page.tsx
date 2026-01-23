'use client';

import { ThresholdSettings } from '@/features/entities/components/ThresholdSettings';
import { Settings, ShieldAlert, Zap, BellRing } from 'lucide-react';

export default function UmbralesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <Zap className="w-5 h-5 animate-pulse" />
                        </div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Políticas de Riesgo</h1>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        Configura los parámetros de tolerancia para las alertas del sistema. Define cuándo la IA debe notificar a la gerencia sobre desviaciones presupuestarias y riesgos operativos.
                    </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monitor de Auditoría Activo</span>
                </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InsightCard
                    icon={<BellRing className="w-5 h-5" />}
                    title="Alertas de Consumo"
                    description="Notificaciones enviadas al superar porcentajes de ejecución."
                    color="amber"
                />
                <InsightCard
                    icon={<ShieldAlert className="w-5 h-5" />}
                    title="Protocolos Críticos"
                    description="Alertas de alta prioridad sobre interrupción de liquidez."
                    color="rose"
                />
                <InsightCard
                    icon={<Settings className="w-5 h-5" />}
                    title="Control Operativo"
                    description="Monitoreo síncrono de tareas de alta prioridad vencidas."
                    color="blue"
                />
            </div>

            {/* Main Configuration Component */}
            <section className="animate-in slide-in-from-bottom duration-700">
                <ThresholdSettings />
            </section>

            {/* Documentation Alert */}
            <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Settings className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-foreground uppercase">Sobre el Motor Predictivo</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Los umbrales establecidos alimentan el <strong>AI Projection Assistant</strong>. Cambiar estos valores ajustará el horizonte de advertencia y los disparadores de notificaciones preventivas en todo el ecosistema BC FABRIC.
                    </p>
                </div>
            </div>
        </div>
    );
}

function InsightCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: 'amber' | 'rose' | 'blue' }) {
    const colors = {
        amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    };

    return (
        <div className="glass-card p-6 flex items-start gap-4 border-b-2 hover:-translate-y-1 transition-all">
            <div className={`p-2.5 rounded-xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h4>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-medium">{description}</p>
            </div>
        </div>
    );
}
