'use client';

import React from 'react';
import { CheckCircle2, Circle, Loader2, ChevronDown, ExternalLink, FileText, Calendar } from 'lucide-react';
import { HIRING_PHASES, HiringPhaseTracking } from '../types';

interface PhaseTrackerProps {
    phases: HiringPhaseTracking[];
    onTogglePhase?: (code: string, completed: boolean) => Promise<void>;
    readOnly?: boolean;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PhaseTracker({ phases, onTogglePhase, readOnly = false }: PhaseTrackerProps) {
    const [toggling, setToggling] = React.useState<string | null>(null);
    const [expanded, setExpanded] = React.useState<string | null>(null);

    const handleToggle = async (code: string, current: boolean) => {
        if (readOnly || !onTogglePhase) return;
        try {
            setToggling(code);
            await onTogglePhase(code, !current);
        } finally {
            setToggling(null);
        }
    };

    const handleExpand = (e: React.MouseEvent, code: string, isCompleted: boolean) => {
        if (!isCompleted) return;
        e.stopPropagation();
        setExpanded(prev => (prev === code ? null : code));
    };

    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estatus de Fases Operativas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HIRING_PHASES.map((phaseDef) => {
                    const tracking = phases.find(p => p.phase_code === phaseDef.code);
                    const isCompleted = tracking?.is_completed || false;
                    const isLoading = toggling === phaseDef.code;
                    const isExpanded = expanded === phaseDef.code;
                    const hasDetails = isCompleted && (tracking?.completed_at || tracking?.notes || tracking?.evidence_link);

                    return (
                        <div
                            key={phaseDef.code}
                            className={`rounded-xl border transition-all overflow-hidden ${
                                isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            {/* Main row — toggle completion on click */}
                            <button
                                type="button"
                                onClick={() => handleToggle(phaseDef.code, isCompleted)}
                                disabled={readOnly || isLoading}
                                className={`w-full flex items-center gap-3 p-3 text-left group ${
                                    isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'
                                } ${!readOnly && 'hover:scale-[1.01] active:scale-[0.99]'} transition-transform`}
                            >
                                <div className="relative shrink-0">
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    ) : isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black leading-tight uppercase tracking-tight">{phaseDef.name}</p>
                                    {isCompleted && tracking?.completed_at ? (
                                        <p className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
                                            Completado: {formatDate(tracking.completed_at)}
                                        </p>
                                    ) : (
                                        <p className="text-[9px] font-bold opacity-60">Peso: {phaseDef.weight}%</p>
                                    )}
                                </div>
                                {/* Expand chevron — only if there are extra details */}
                                {hasDetails && (
                                    <button
                                        type="button"
                                        aria-label={isExpanded ? 'Contraer detalles' : 'Ver detalles'}
                                        onClick={(e) => handleExpand(e, phaseDef.code, isCompleted)}
                                        className="shrink-0 p-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
                                    >
                                        <ChevronDown
                                            className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
                                                isExpanded ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                )}
                            </button>

                            {/* Expandable detail panel */}
                            {hasDetails && isExpanded && (
                                <div className="px-4 pb-3 border-t border-emerald-500/20 space-y-2 pt-2">
                                    {tracking?.completed_at && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700/80 dark:text-emerald-400/70">
                                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                                            <span>{formatDate(tracking.completed_at)}</span>
                                        </div>
                                    )}
                                    {tracking?.notes && (
                                        <div className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400">
                                            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                                            <span className="leading-relaxed">{tracking.notes}</span>
                                        </div>
                                    )}
                                    {tracking?.evidence_link && (
                                        <a
                                            href={tracking.evidence_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center gap-2 text-[10px] font-bold text-primary hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            Ver evidencia
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
