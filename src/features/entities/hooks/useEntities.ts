import { useState, useEffect, useCallback } from 'react';
import { entityService } from '../services/entityService';
import { Entity, EntityFormData } from '../types';

export function useEntities() {
    const [entities, setEntities] = useState<(Entity & { current_q_expenses?: number })[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEntities = useCallback(async () => {
        try {
            setLoading(true);
            const [entitiesData, expensesData] = await Promise.all([
                entityService.getEntities(),
                entityService.getQuarterlyExpenses()
            ]);

            const merged = entitiesData.map(ent => ({
                ...ent,
                current_q_expenses: expensesData[ent.id] || 0
            }));

            setEntities(merged);
        } catch (error) {
            console.error('Error fetching entities with expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createEntity = async (data: EntityFormData) => {
        try {
            const newEntity = await entityService.createEntity(data);
            setEntities(prev => [newEntity, ...prev]);
            return newEntity;
        } catch (error) {
            console.error('Error creating entity:', error);
            throw error;
        }
    };

    const updateEntity = async (id: string, data: EntityFormData) => {
        try {
            const updated = await entityService.updateEntity(id, data);
            setEntities(prev => prev.map(e => e.id === id ? updated : e));
            return updated;
        } catch (error: any) {
            console.error('Error updating entity:', error);
            throw error;
        }
    };

    const deleteEntity = async (id: string) => {
        try {
            await entityService.deleteEntity(id);
            setEntities(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting entity:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchEntities();
    }, [fetchEntities]);

    return {
        entities,
        loading,
        createEntity,
        updateEntity,
        deleteEntity,
        refresh: fetchEntities
    };
}
