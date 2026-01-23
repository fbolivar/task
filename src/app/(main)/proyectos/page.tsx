'use client';

import { useState, useMemo } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { ProjectModal } from '@/features/projects/components/ProjectModal';
import { Project, ProjectFormData } from '@/features/projects/types';
import { Loader2, Briefcase, Plus } from 'lucide-react';

export default function ProyectosPage() {
    const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
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
            <div className="flex-1 flex flex-col items-center justify-center p-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-medium">Cargando portafolio...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            <ProjectHeader
                onSearch={setSearchQuery}
                onNewProject={handleOpenCreateModal}
                onStatusFilter={setStatusFilter}
                totalProjects={projects.length}
            />

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                <div className="flex flex-col items-center justify-center p-20 glass-card border-dashed">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Briefcase className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">No se encontraron proyectos</h3>
                    <p className="text-muted-foreground mt-2 mb-8 text-center max-w-md">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Intenta ajustar tus filtros de búsqueda para encontrar lo que necesitas.'
                            : 'Aún no has creado ningún proyecto en esta entidad. Comienza creando el primero.'}
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Crear mi primer proyecto
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
