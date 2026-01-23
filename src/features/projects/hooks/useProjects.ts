import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/projectService';
import { Project, ProjectFormData } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjects(activeEntityId);
            setProjects(data);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching projects:', err);
            setError(err.message || 'Error al cargar proyectos');
        } finally {
            setLoading(false);
        }
    }, [activeEntityId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = async (data: ProjectFormData) => {
        try {
            const newProject = await projectService.createProject(data);
            setProjects(prev => [newProject, ...prev]);
            return newProject;
        } catch (err: any) {
            console.error('Error creating project:', err);
            throw err;
        }
    };

    const updateProject = async (id: string, data: Partial<ProjectFormData>) => {
        try {
            const updated = await projectService.updateProject(id, data);
            setProjects(prev => prev.map(p => p.id === id ? updated : p));
            return updated;
        } catch (err: any) {
            console.error('Error updating project:', err);
            throw err;
        }
    };

    const deleteProject = async (id: string) => {
        try {
            await projectService.deleteProject(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting project:', err);
            throw err;
        }
    };

    return {
        projects,
        loading,
        error,
        refresh: fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}
