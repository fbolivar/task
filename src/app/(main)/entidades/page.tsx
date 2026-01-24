'use client';

import { useState, useMemo } from 'react';
import { useEntities } from '@/features/entities/hooks/useEntities';
import { EntityHeader } from '@/features/entities/components/EntityHeader';
import { EntityCard } from '@/features/entities/components/EntityCard';
import { EntityModal } from '@/features/entities/components/EntityModal';
import { Entity, EntityFormData } from '@/features/entities/types';
import { Loader2, Building2, Plus, Sparkles } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

export default function EntidadesPage() {
    const { entities, loading, createEntity, updateEntity, deleteEntity } = useEntities();
    const { t } = useSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'Prospecto' | 'Cliente' | 'Partner'>('All');

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

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
        }
    };

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
            />

            {filteredEntities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-reveal">
                    {filteredEntities.map((entity) => (
                        <EntityCard
                            key={entity.id}
                            entity={entity}
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
