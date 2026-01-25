'use client';

import {
    Calendar,
    CheckCircle2,
    Clock,
    User as UserIcon,
    MoreHorizontal,
    Edit3,
    Trash2,
    Flag,
    Zap
} from 'lucide-react';
import { Task } from '../types';
import { useState } from 'react';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onArchive: (id: string) => void;
    onStatusChange: (task: Task, newStatus: string) => void;
}

export function TaskCard({ task, onEdit, onArchive, onStatusChange }: TaskCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgente': return 'text-red-500 bg-red-500/10';
            case 'Alta': return 'text-orange-500 bg-orange-500/10';
            case 'Media': return 'text-blue-500 bg-blue-500/10';
            default: return 'text-slate-500 bg-slate-500/10';
        }
    };

    const getSubStatusStyles = (subStatus: string) => {
        switch (subStatus) {
            case 'Bloqueado': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Demorado': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'En Riesgo': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        }
    };

    const isOverdue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'Completado';

    return (
        <div className="card-premium group relative p-6 transition-all duration-500 hover:translate-y-[-4px]">
            <div className="flex items-start gap-5 relative z-10">
                <button
                    onClick={() => onStatusChange(task, task.status === 'Completado' ? 'Pendiente' : 'Completado')}
                    className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${task.status === 'Completado'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'border-slate-200 dark:border-white/10 hover:border-primary hover:scale-110'
                        }`}
                >
                    {task.status === 'Completado' ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 transition-all group-hover:bg-primary" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0 flex-1">
                            <h4 className={`font-black text-lg transition-all tracking-tight leading-tight ${task.status === 'Completado' ? 'text-muted-foreground/50 line-through' : 'text-foreground group-hover:text-primary'
                                }`}>
                                {task.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                                <Zap className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                                    {task.project?.name || 'Operación Directa'}
                                </span>
                            </div>
                        </div>

                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            >
                                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-2 w-40 glass-card shadow-2xl z-20 p-1.5 border border-white/20 animate-in fade-in zoom-in-95">
                                    <button
                                        onClick={() => { onEdit(task); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" /> Modificar
                                    </button>
                                    <button
                                        onClick={() => { onArchive(task.id); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-amber-500/10 text-amber-600 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" /> Archivar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        {/* Due Date */}
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${isOverdue ? 'bg-red-500/10 text-red-500 shadow-sm shadow-red-500/10' : 'bg-slate-100/50 dark:bg-white/5 text-muted-foreground'
                            }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {task.end_date ? new Date(task.end_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : 'Flexible'}
                        </div>

                        {/* Priority */}
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${getPriorityColor(task.priority)} shadow-sm`}>
                            <Flag className="w-3.5 h-3.5 fill-current" />
                            {task.priority}
                        </div>

                        {/* Sub Status Badge */}
                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all hover:scale-105 ${getSubStatusStyles(task.sub_status)}`}>
                            {task.sub_status}
                        </div>
                    </div>

                    {/* Bottom Info: Assignee */}
                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4">
                        <div className="flex items-center gap-3 group/user">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover/user:scale-110 transition-transform">
                                <UserIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">Responsable</span>
                                <span className="text-[11px] font-black text-foreground uppercase tracking-tight truncate w-24">
                                    {task.assignee?.full_name?.split(' ')[0] || 'Unassigned'}
                                </span>
                            </div>
                        </div>

                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl shadow-sm transition-all group-hover:translate-x-[-4px] ${task.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-500' :
                            task.status === 'En Progreso' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-slate-500/10 text-muted-foreground'
                            }`}>
                            {task.status}
                        </div>
                    </div>

                    {/* Drive Integration */}
                    {task.evidence_link && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <a
                                href={task.evidence_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors bg-slate-50 dark:bg-white/5 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-4 h-4" alt="Drive" />
                                Ver Archivos en Drive
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
