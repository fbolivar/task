'use client';

import { ReassignmentAuditPanel } from '@/features/entities/components/ReassignmentAuditPanel';
import { History, ShieldCheck, Zap, Info } from 'lucide-react';

export default function AuditoriaPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Log de Gobernanza</h1>
                    </div>
                    <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        Supervisa las acciones autónomas del ecosistema. Este panel registra cada re-asignación ejecutada por los protocolos de riesgo para asegurar la continuidad de los hitos críticos.
                    </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-sm">
                    <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Motor de Autogestión Activo</span>
                </div>
            </div>

            {/* Audit Panel Integration */}
            <section className="animate-in slide-in-from-bottom duration-700">
                <ReassignmentAuditPanel />
            </section>

            {/* Documentation Alert */}
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Info className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight">Sobre la Integridad de Datos</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Los registros de este panel son inmutables y sirven como sustrato legal de la operatividad del ecosistema. Cualquier desviación detectada por el <strong>AI Risk Monitor</strong> que resulte en un cambio de ownership quedará plasmada aquí con su respectiva justificación algorítmica.
                    </p>
                </div>
            </div>
        </div>
    );
}
