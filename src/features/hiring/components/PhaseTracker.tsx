'use client';

import React from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { HIRING_PHASES, HiringPhaseTracking } from '../types';

interface PhaseTrackerProps {
    phases: HiringPhaseTracking[];
    onTogglePhase?: (code: string, completed: boolean) => Promise<void>;
    readOnly?: boolean;
}

export function PhaseTracker({ phases, onTogglePhase, readOnly = false }: PhaseTrackerProps) {
    const [toggling, setToggling] = React.useState<string | null>(null);

    const handleToggle = async (code: string, current: boolean) => {
        if (readOnly || !onTogglePhase) return;
        try {
            setToggling(code);
            await onTogglePhase(code, !current);
        } finally {
            setToggling(null);
        }
    };

    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estatus de Fases Operativas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HIRING_PHASES.map((phaseDef) => {
                    const tracking = phases.find(p => p.phase_code === phaseDef.code);
                    const isCompleted = tracking?.is_completed || false;
                    const isLoading = toggling === phaseDef.code;

                    return (
                        <button
                            key={phaseDef.code}
                            type="button"
                            onClick={() => handleToggle(phaseDef.code, isCompleted)}
                            disabled={readOnly || isLoading}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${isCompleted
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500'
                                } ${!readOnly && 'hover:scale-[1.02] active:scale-[0.98]'}`}
                        >
                            <div className="relative">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black leading-tight uppercase tracking-tight">{phaseDef.name}</p>
                                <p className="text-[9px] font-bold opacity-60">Peso: {phaseDef.weight}%</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
