'use client';

import { useState, useMemo } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectModal } from '@/features/projects/components/ProjectModal';
import { Project, ProjectFormData } from '@/features/projects/types';
import { Loader2, Briefcase, Plus, Sparkles } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

export default function ProyectosPage() {
    const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
    const { t } = useSettings();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            const matchesSearch =
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                project.entity?.name.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);

    const handleOpenCreateModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (project: Project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleSave = async (data: ProjectFormData) => {
        if (editingProject) {
            await updateProject(editingProject.id, data);
        } else {
            await createProject(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
            await deleteProject(id);
        }
    };

    if (loading && projects.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-reveal">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="relative w-16 h-16 text-primary animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mb-2">Sincronizando Factory</p>
                <p className="text-muted-foreground font-black text-sm uppercase tracking-widest">{t('general.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <ProjectHeader
                onSearch={setSearchQuery}
                onNewProject={handleOpenCreateModal}
                onStatusFilter={setStatusFilter}
                totalProjects={projects.length}
            />

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-reveal">
                    {filteredProjects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={handleOpenEditModal}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 card-premium border-dashed border-2 border-slate-200 dark:border-white/10 group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-slate-100 dark:border-white/5">
                            <Briefcase className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Central Intelligence</span>
                    </div>

                    <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 transition-colors group-hover:text-primary">
                        {searchQuery || statusFilter !== 'all' ? 'Sin resultados estratégicos' : t('projects.empty')}
                    </h3>

                    <p className="text-muted-foreground font-medium text-center max-w-sm mb-10 leading-relaxed">
                        {searchQuery || statusFilter !== 'all'
                            ? t('projects.emptyDesc')
                            : t('projects.createFirst')}
                    </p>

                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary group/btn"
                    >
                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">{t('projects.createFirst')}</span>
                    </button>
                </div>
            )}

            <ProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                project={editingProject}
            />
        </div>
    );
}
