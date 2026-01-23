'use client';

import { useState, useMemo } from 'react';
import { useEntities } from '@/features/entities/hooks/useEntities';
import { EntityHeader } from '@/features/entities/components/EntityHeader';
import { EntityCard } from '@/features/entities/components/EntityCard';
import { EntityModal } from '@/features/entities/components/EntityModal';
import { Entity, EntityFormData } from '@/features/entities/types';
import { Loader2, Building2 } from 'lucide-react';

export default function EntidadesPage() {
    const { entities, loading, createEntity, updateEntity, deleteEntity } = useEntities();
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
        if (window.confirm('¿Estás seguro de eliminar esta entidad? Esta acción no se puede deshacer y podría afectar la visibilidad de datos asociados.')) {
            await deleteEntity(id);
        }
    };

    if (loading && entities.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Sincronizando Ecosistema...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <EntityHeader
                onSearch={setSearchTerm}
                onNewEntity={handleOpenCreateModal}
                filterType={filterType}
                onFilterChange={setFilterType}
            />

            {filteredEntities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                <div className="flex flex-col items-center justify-center p-20 glass-card border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Sin coincidencias detectadas</h3>
                    <p className="text-muted-foreground mt-2 mb-8 text-center max-w-sm font-medium">
                        {searchTerm || filterType !== 'All'
                            ? 'No encontramos entidades con los filtros actuales.'
                            : 'El ecosistema está vacío. Comienza integrando tu primera entidad corporativa.'}
                    </p>
                    <button
                        onClick={handleOpenCreateModal}
                        className="btn-primary px-8"
                    >
                        Registrar Entidad
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
