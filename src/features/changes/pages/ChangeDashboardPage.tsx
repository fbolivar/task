'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { GitPullRequest, Search, Filter, Plus } from 'lucide-react';
import { changeService } from '../services/changeService';
import { projectService } from '@/features/projects/services/projectService';
import { userService } from '@/features/users/services/userService';
import { ChangeRequest, ChangeRequestFormData } from '../types';
import { ChangeRequestCard } from '../components/ChangeRequestCard';
import { ChangeRequestForm } from '../components/ChangeRequestForm';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useRouter } from 'next/navigation';

export function ChangeDashboardPage() {
    const { t } = useSettings();
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCR, setSelectedCR] = useState<ChangeRequest | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Auxiliar Data
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [assets, setAssets] = useState<{ id: string; name: string }[]>([]);
    const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
    const { profile, activeEntityId } = useAuthStore();
    const router = useRouter();

    // Check activation
    const isEnabled = !!profile?.profile_entities?.some((pe: any) => {
        const entity = Array.isArray(pe.entity) ? pe.entity[0] : pe.entity;
        if (!entity) return false;

        const enabled = entity.is_change_management_enabled === true;
        if (activeEntityId === 'all') return enabled;
        return entity.id === activeEntityId && enabled;
    });

    useEffect(() => {
        if (!loading && !isEnabled) {
            router.push('/dashboard');
        }
    }, [isEnabled, loading, router]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [crData, projectsData, assetsData, usersData] = await Promise.all([
                changeService.getChangeRequests(),
                projectService.getProjects('all'),
                changeService.getAssets(),
                userService.getUsers()
            ]);

            setChangeRequests(crData);
            setProjects(projectsData.map(p => ({ id: p.id, name: p.name })));
            setAssets(assetsData);
            setUsers(usersData.map(u => ({ id: u.id, full_name: u.full_name || 'Sin nombre' })));

        } catch (error) {
            console.error('Error fetching dashboard data:', JSON.stringify(error, null, 2));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleSave = async (data: ChangeRequestFormData) => {
        try {
            if (selectedCR) {
                await changeService.updateChangeRequest(selectedCR.id, data);
            } else {
                await changeService.createChangeRequest(data);
            }
            await fetchAllData();
        } catch (error) {
            console.error('Error saving change request:', error);
            alert('Error al guardar. Revisa la consola.');
        }
    };

    const handleEdit = async (cr: ChangeRequest) => {
        // Fetch full details (nested) before editing
        try {
            const fullCR = await changeService.getChangeRequestById(cr.id);
            setSelectedCR(fullCR);
            setIsFormOpen(true);
        } catch (error) {
            console.error("Error loading CR details", error);
        }
    };

    const handleNew = () => {
        setSelectedCR(undefined);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta solicitud de cambio? Esta acción no se puede deshacer.')) return;

        try {
            await changeService.deleteChangeRequest(id);
            await fetchAllData();
        } catch (error) {
            console.error('Error deleting change request:', error);
            alert('Error al eliminar. Revisa la consola.');
        }
    };

    const filteredRequests = changeRequests.filter(cr => {
        const matchesSearch = cr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cr.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || cr.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <GitPullRequest className="w-8 h-8 text-orange-500" />
                        {t('nav.change_management')}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">Control y seguimiento de solicitudes de cambio</p>
                </div>
                <button
                    onClick={handleNew}
                    className="btn-primary flex items-center gap-2 px-6 py-3 shadow-xl shadow-orange-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Solicitud
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Solicitudes', value: changeRequests.length, color: 'bg-blue-500' },
                    { label: 'Pendientes', value: changeRequests.filter(c => c.status === 'submitted').length, color: 'bg-yellow-500' },
                    { label: 'Aprobados', value: changeRequests.filter(c => c.status === 'approved').length, color: 'bg-emerald-500' },
                    { label: 'Rechazados', value: changeRequests.filter(c => c.status === 'rejected').length, color: 'bg-red-500' }
                ].map((metric, i) => (
                    <div key={i} className="glass-card p-5 border border-white/10 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-16 h-16 ${metric.color} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform`} />
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">{metric.label}</p>
                        <p className="text-3xl font-black mt-2">{metric.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por código o título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    />
                </div>
                <div className="relative pointer-events-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                        className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-medium appearance-none h-full pointer-events-auto cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="draft">Borrador</option>
                        <option value="submitted">Pendiente</option>
                        <option value="approved">Aprobado</option>
                        <option value="rejected">Rechazado</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Cargando...</p>
                ) : filteredRequests.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GitPullRequest className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-lg font-bold">No se encontraron solicitudes</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    filteredRequests.map(cr => (
                        <ChangeRequestCard
                            key={cr.id}
                            changeRequest={cr}
                            onClick={() => handleEdit(cr)}
                            onDelete={() => handleDelete(cr.id)}
                        />
                    ))
                )}
            </div>

            {isFormOpen && (
                <ChangeRequestForm
                    initialData={selectedCR}
                    projects={projects}
                    assets={assets}
                    users={users}
                    onSave={handleSave}
                    onStatusChange={async (id, status) => {
                        await changeService.updateStatus(id, status, profile?.id);
                        await fetchAllData();
                    }}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}
