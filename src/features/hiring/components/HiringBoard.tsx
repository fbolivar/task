'use client';

import React from 'react';
import {
    MoreVertical,
    Trash2,
    Edit,
    Target,
    Briefcase,
    User as UserIcon,
    DollarSign,
    ArrowRight,
    TrendingUp
} from 'lucide-react';
import { HiringProcess } from '../types';

interface HiringBoardProps {
    processes: HiringProcess[];
    onEdit: (process: HiringProcess) => void;
    onDelete: (id: string) => void;
    readOnly?: boolean;
}

export function HiringBoard({ processes, onEdit, onDelete, readOnly = false }: HiringBoardProps) {
    if (processes.length === 0) return (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No hay procesos de contratación</h3>
            <p className="text-sm text-muted-foreground font-medium max-w-[250px]">
                {readOnly ? 'No hay procesos activos para visualizar en este momento.' : 'Comienza un nuevo proceso haciendo clic en el botón superior.'}
            </p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-reveal">
            {processes.map((process) => (
                <div
                    key={process.id}
                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                >
                    {/* Top Progress Indicator */}
                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800/50">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500 transition-all duration-1000"
                            style={{ width: `${process.total_progress}%` }}
                        />
                    </div>

                    <div className="p-10 space-y-8 flex-1 flex flex-col">
                        {/* Header: Status & Advance */}
                        <div className="flex items-center gap-6">
                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${process.status === 'Legalizado'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : process.status === 'Adjudicado'
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                    : 'bg-primary/5 text-primary border-primary/10'
                                }`}>
                                {process.status}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span>{process.total_progress}% Avance</span>
                            </div>
                        </div>

                        {/* Title & Rapid Actions */}
                        <div className="space-y-6">
                            <h4 className="text-3xl font-black text-foreground tracking-tighter leading-tight group-hover:text-primary transition-colors pr-10">
                                {process.title}
                            </h4>

                            {!readOnly && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onEdit(process)}
                                        className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 border border-slate-100 dark:border-white/5 transition-all"
                                        title="Editar"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(process.id)}
                                        className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 border border-slate-100 dark:border-white/5 transition-all"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Information Grid (Rounded Cards) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                            <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-white/5 shadow-sm">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">Proyecto</p>
                                    <p className="text-sm font-black text-foreground truncate">{process.project?.name || 'Operación Directa'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 transition-colors group-hover:bg-white dark:group-hover:bg-slate-800">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary border border-slate-100 dark:border-white/5 shadow-sm">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">Estimado</p>
                                    <p className="text-sm font-black text-foreground">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(process.estimated_amount)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="px-10 py-6 border-t border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                                {process.assignee?.avatar_url ? (
                                    <img src={process.assignee.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-[0.2em] leading-none mb-1.5">Responsable</p>
                                <p className="text-sm font-black text-foreground tracking-tight">{process.assignee?.full_name || 'Sin Asignar'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => onEdit(process)}
                            className="group/btn flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:text-black dark:hover:text-white transition-all"
                        >
                            <span>{readOnly ? 'Ver Detalles' : 'Gestionar Fases'}</span>
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
