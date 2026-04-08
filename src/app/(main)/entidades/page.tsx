'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useEntities } from '@/features/entities/hooks/useEntities';
import { EntityHeader } from '@/features/entities/components/EntityHeader';
import { EntityCard } from '@/features/entities/components/EntityCard';
import { EntityModal } from '@/features/entities/components/EntityModal';
import { EntityComparison } from '@/features/entities/components/EntityComparison';
import type { EntityStats } from '@/features/entities/components/EntityComparison';
import { Entity, EntityFormData } from '@/features/entities/types';
import { Loader2, Building2, Plus, Sparkles, GitCompareArrows, X } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { createClient } from '@/lib/supabase/client';

interface ResourceCounts {
    projectCount: number;
    taskCount: number;
    assetCount: number;
    budget: number;
    completionRate: number;
}

export default function EntidadesPage() {
    const { entities, loading, createEntity, updateEntity, deleteEntity } = useEntities();
    const { t } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Prospecto' | 'Cliente' | 'Partner'>('All');
    const [resourceCounts, setResourceCounts] = useState<Record<string, ResourceCounts>>({});

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

    // Comparison state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showComparison, setShowComparison] = useState(false);

    const filteredEntities = useMemo(() => {
        return entities.filter(ent => {
            const matchesSearch =
                ent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ent.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ent.contact_info?.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = filterType === 'All' || ent.type === filterType;
            return matchesSearch && matchesType;
        });
    }, [entities, searchTerm, filterType]);

    const fetchResourceCounts = useCallback(async () => {
        if (entities.length === 0) return;

        const supabase = createClient();
        const entityIds = entities.map(e => e.id);

        try {
            const [projectsRes, tasksRes, assetsRes] = await Promise.all([
                supabase
                    .from('projects')
                    .select('entity_id, budget, status')
                    .in('entity_id', entityIds),
                supabase
                    .from('tasks')
                    .select('status, projects(entity_id)')
                    .not('projects', 'is', null),
                supabase
                    .from('assets')
                    .select('entity_id')
                    .in('entity_id', entityIds),
            ]);

            const counts: Record<string, ResourceCounts> = {};
            entityIds.forEach(id => {
                counts[id] = { projectCount: 0, taskCount: 0, assetCount: 0, budget: 0, completionRate: 0 };
            });

            // Track completionRate numerator/denominator per entity
            const completedProjects: Record<string, number> = {};
            entityIds.forEach(id => { completedProjects[id] = 0; });

            if (projectsRes.data) {
                projectsRes.data.forEach((row: { entity_id: string; budget: number | null; status: string }) => {
                    if (row.entity_id && counts[row.entity_id]) {
                        counts[row.entity_id].projectCount += 1;
                        counts[row.entity_id].budget += row.budget ?? 0;
                        if (row.status === 'Completado') {
                            completedProjects[row.entity_id] = (completedProjects[row.entity_id] ?? 0) + 1;
                        }
                    }
                });
            }

            // Compute completion rate per entity
            entityIds.forEach(id => {
                const total = counts[id].projectCount;
                counts[id].completionRate = total > 0 ? (completedProjects[id] / total) * 100 : 0;
            });

            if (tasksRes.data) {
                tasksRes.data.forEach((row: { projects: { entity_id: string } | null }) => {
                    const entityId = row.projects?.entity_id;
                    if (entityId && counts[entityId]) {
                        counts[entityId].taskCount += 1;
                    }
                });
            }

            if (assetsRes.data) {
                assetsRes.data.forEach((row: { entity_id: string }) => {
                    if (row.entity_id && counts[row.entity_id]) {
                        counts[row.entity_id].assetCount += 1;
                    }
                });
            }

            setResourceCounts(counts);
        } catch (error) {
            console.error('Error fetching resource counts:', error);
        }
    }, [entities]);

    useEffect(() => {
        fetchResourceCounts();
    }, [fetchResourceCounts]);

    const handleOpenCreateModal = () => {
        setEditingEntity(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (entity: Entity) => {
        setEditingEntity(entity);
        setIsModalOpen(true);
    };

    const handleSave = async (data: EntityFormData) => {
        if (editingEntity) {
            await updateEntity(editingEntity.id, data);
        } else {
            await createEntity(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta entidad? Esta acción no se puede deshacer.')) {
            await deleteEntity(id);
            setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    const handleExport = () => {
        const headers = ['Nombre', 'Tipo', 'Correo', 'Teléfono', 'Dirección', 'Contacto'];
        const rows = filteredEntities.map(e => [
            e.name,
            e.type,
            e.contact_info?.email ?? '',
            e.contact_info?.phone ?? '',
            e.address ?? '',
            e.contact_name ?? '',
        ]);

        const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
        const csvContent = [headers, ...rows]
            .map(row => row.map(escape).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `entidades_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ── Comparison helpers ─────────────────────────────────────────────────────

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < 3) {
                next.add(id);
            }
            return next;
        });
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
        setShowComparison(false);
    };

    const selectedEntities = entities.filter(e => selectedIds.has(e.id));

    const entityStatsForComparison: Record<string, EntityStats> = useMemo(() => {
        const result: Record<string, EntityStats> = {};
        selectedEntities.forEach(e => {
            const counts = resourceCounts[e.id];
            result[e.id] = {
                projects:       counts?.projectCount   ?? 0,
                tasks:          counts?.taskCount       ?? 0,
                budget:         counts?.budget          ?? 0,
                completionRate: counts?.completionRate  ?? 0,
            };
        });
        return result;
    }, [selectedEntities, resourceCounts]);

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading && entities.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-reveal">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <Loader2 className="relative w-16 h-16 text-primary animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mb-2">Syncing Ecosystem</p>
                <p className="text-muted-foreground font-black text-sm uppercase tracking-widest">{t('general.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <EntityHeader
                onSearch={setSearchTerm}
                onNewEntity={handleOpenCreateModal}
                filterType={filterType}
                onFilterChange={setFilterType}
                onExport={handleExport}
            />

            {/* ── Comparison action bar ─────────────────────────────────────── */}
            {selectedIds.size >= 1 && (
                <div
                    role="status"
                    aria-live="polite"
                    className="flex flex-wrap items-center gap-4 px-6 py-4 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                    <div className="flex items-center gap-2 text-sm font-black text-primary">
                        <GitCompareArrows className="w-4 h-4" />
                        <span>
                            {selectedIds.size === 1
                                ? '1 entidad seleccionada — selecciona al menos 1 más para comparar'
                                : `${selectedIds.size} entidades seleccionadas`}
                        </span>
                        {selectedIds.size < 3 && (
                            <span className="text-[10px] text-muted-foreground font-semibold">(máx. 3)</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        {selectedIds.size >= 2 && (
                            <button
                                type="button"
                                onClick={() => setShowComparison(v => !v)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                                <GitCompareArrows className="w-3.5 h-3.5" />
                                {showComparison ? 'Ocultar' : 'Comparar'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClearSelection}
                            aria-label="Limpiar selección"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Limpiar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Comparison panel ──────────────────────────────────────────── */}
            {showComparison && selectedEntities.length >= 2 && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <EntityComparison
                        entities={selectedEntities}
                        entityStats={entityStatsForComparison}
                        onClose={() => setShowComparison(false)}
                    />
                </div>
            )}

            {/* ── Entity grid ───────────────────────────────────────────────── */}
            {filteredEntities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-reveal">
                    {filteredEntities.map((entity) => {
                        const counts = resourceCounts[entity.id];
                        return (
                            <EntityCard
                                key={entity.id}
                                entity={entity}
                                onEdit={handleOpenEditModal}
                                onDelete={handleDelete}
                                projectCount={counts?.projectCount}
                                taskCount={counts?.taskCount}
                                assetCount={counts?.assetCount}
                                isSelected={selectedIds.has(entity.id)}
                                onToggleSelect={handleToggleSelect}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 card-premium border-dashed border-2 border-slate-200 dark:border-white/10 group">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative w-24 h-24 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-slate-100 dark:border-white/5">
                            <Building2 className="w-12 h-12 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Strategic Partners</span>
                    </div>

                    <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 transition-colors group-hover:text-primary">
                        {searchTerm || filterType !== 'All' ? 'Sin coincidencias' : 'Ecosistema Desierto'}
                    </h3>

                    <p className="text-muted-foreground font-medium text-center max-w-sm mb-10 leading-relaxed">
                        {searchTerm || filterType !== 'All'
                            ? 'No encontramos entidades con los filtros actuales.'
                            : 'El ecosistema corporativo está vacío. Comienza integrando tu primera entidad estratégica.'}
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="btn-primary group/btn"
                    >
                        <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" />
                        <span className="font-bold tracking-wide">Vincular Entidad</span>
                    </button>
                </div>
            )}

            <EntityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                entity={editingEntity}
            />
        </div>
    );
}
