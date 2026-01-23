'use client';

import {
    Calendar,
    MoreVertical,
    Edit2,
    Trash2,
    Building2,
    Target,
    Activity,
    Star,
    Layers
} from 'lucide-react';
import { Project } from '../types';
import { useState } from 'react';

interface ProjectCardProps {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'Crítica': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Media': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Completado': return 'bg-emerald-500/10 text-emerald-500';
            case 'Activo': return 'bg-primary/10 text-primary';
            case 'Pausado': return 'bg-amber-500/10 text-amber-500';
            default: return 'bg-slate-500/10 text-slate-500';
        }
    };

    // Calculate progress based on sub-projects or default to a random/mock value for demo if empty
    const progress = project.sub_projects && project.sub_projects.length > 0
        ? Math.round((project.sub_projects.filter(sp => sp.status === 'Completado').length / project.sub_projects.length) * 100)
        : project.status === 'Completado' ? 100 : 0;

    return (
        <div className="glass-card group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border border-white/20 relative">
            {/* Top Priority Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest border-l border-b transition-colors ${getPriorityStyles(project.priority)}`}>
                {project.priority}
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate w-48">
                                {project.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Building2 className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{project.entity?.name || 'Varios'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-40 glass-card shadow-xl z-10 p-1 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => { onEdit(project); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" /> Editar
                                </button>
                                <button
                                    onClick={() => { onDelete(project.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6 min-h-[40px]">
                    {project.description || 'Sin descripción detallada para este proyecto.'}
                </p>

                {/* Progress Section */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-muted-foreground">Progreso Total</span>
                        <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Footer Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Star className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Satisfacción</span>
                            <span className="text-xs font-black">{project.customer_satisfaction || 0}/10</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Hitos</span>
                            <span className="text-xs font-black">{project.sub_projects?.length || 0} Fases</span>
                        </div>
                    </div>
                </div>

                {/* Date & Support Info */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Sin fecha'}
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(project.status)}`}>
                        {project.status}
                    </div>
                </div>
            </div>
        </div>
    );
}
