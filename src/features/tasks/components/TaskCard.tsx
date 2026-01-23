'use client';

import {
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    User as UserIcon,
    MoreHorizontal,
    Edit3,
    Trash2,
    Flag
} from 'lucide-react';
import { Task } from '../types';
import { useState } from 'react';

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (id: string) => void;
    onStatusChange: (task: Task, newStatus: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Urgente': return 'text-red-600';
            case 'Alta': return 'text-orange-600';
            case 'Media': return 'text-blue-600';
            default: return 'text-slate-500';
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
        <div className="glass-card p-5 group hover:border-primary/30 transition-all duration-300 relative border border-transparent">
            <div className="flex items-start gap-4">
                <button
                    onClick={() => onStatusChange(task, task.status === 'Completado' ? 'Pendiente' : 'Completado')}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completado'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-700 hover:border-primary'
                        }`}
                >
                    {task.status === 'Completado' && <CheckCircle2 className="w-4 h-4" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-bold text-base transition-all truncate ${task.status === 'Completado' ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}>
                            {task.title}
                        </h4>

                        <div className="relative shrink-0">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-32 glass-card shadow-xl z-10 p-1">
                                    <button
                                        onClick={() => { onEdit(task); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Editar
                                    </button>
                                    <button
                                        onClick={() => { onDelete(task.id); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {task.project?.name || 'Carga Operativa'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        {/* Due Date */}
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-md ${isOverdue ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                            }`}>
                            <Clock className="w-3 h-3" />
                            {task.end_date ? new Date(task.end_date).toLocaleDateString() : 'Sin fecha'}
                        </div>

                        {/* Priority */}
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${getPriorityColor(task.priority)}`}>
                            <Flag className="w-3 h-3 fill-current" />
                            {task.priority}
                        </div>

                        {/* Sub Status Badge */}
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getSubStatusStyles(task.sub_status)}`}>
                            {task.sub_status}
                        </div>
                    </div>

                    {/* Bottom Info: Assignee */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground truncate w-24">
                                {task.assignee?.full_name || 'Sin asignar'}
                            </span>
                        </div>

                        <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${task.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-500' :
                            task.status === 'En Progreso' ? 'bg-blue-500/10 text-blue-500' :
                                'bg-slate-500/10 text-slate-500'
                            }`}>
                            {task.status}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
