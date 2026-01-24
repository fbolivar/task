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
        <div className="card-premium group relative">
            {/* Top Priority Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase tracking-[0.2em] border-l border-b transition-all duration-500 z-10 group-hover:scale-105 ${getPriorityStyles(project.priority)} shadow-sm`}>
                {project.priority}
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:rotate-6 transition-transform duration-500">
                                <Target className="w-7 h-7" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-all tracking-tight truncate leading-none mb-2" title={project.name}>
                                {project.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                                <Building2 className="w-3 h-3 text-primary" />
                                <span className="truncate max-w-[150px]">{project.entity?.name || 'Corporativo'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all hover:scale-110"
                        >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-3 w-44 glass-card shadow-2xl z-20 p-1.5 border border-white/20 animate-in fade-in zoom-in-95">
                                <button
                                    onClick={() => { onEdit(project); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" /> Modificar
                                </button>
                                <button
                                    onClick={() => { onDelete(project.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" /> Archivar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-8 min-h-[40px] leading-relaxed font-medium">
                    {project.description || 'Sin descripción estratégica definida para este proyecto corporativo.'}
                </p>

                {/* Progress Section */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-muted-foreground/60">Estado de Ejecución</span>
                        <span className="text-primary">{progress}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-1000 ease-spring"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Footer Metrics */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 group/stat">
                        <div className="p-2.5 rounded-xl bg-emerald-500/5 group-hover/stat:bg-emerald-500/10 transition-colors">
                            <Star className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Rating</span>
                            <span className="text-sm font-black text-foreground tracking-tight">{project.customer_satisfaction || 0}/10</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 group/stat">
                        <div className="p-2.5 rounded-xl bg-indigo-500/5 group-hover/stat:bg-indigo-500/10 transition-colors">
                            <Layers className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Hitos</span>
                            <span className="text-sm font-black text-foreground tracking-tight">{project.sub_projects?.length || 0} Fases</span>
                        </div>
                    </div>
                </div>

                {/* Date & Support Info */}
                <div className="mt-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {project.end_date ? new Date(project.end_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : 'Indefinido'}
                    </div>

                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm transition-all group-hover:translate-x-[-4px] ${getStatusStyles(project.status)}`}>
                        {project.status}
                    </div>
                </div>
            </div>
        </div>
    );
}
