'use client';

import { useState, useEffect, useCallback } from 'react';
import { financeService } from '../services/financeService';
import { entityService } from '@/features/entities/services/entityService';
import { FinancialRecord, FinancialSummary } from '../types';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useFinance(projectId?: string) {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [entityBudget, setEntityBudget] = useState<number>(0);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    const fetchFinancialData = useCallback(async () => {
        try {
            setLoading(true);
            const [recordsData, entityData] = await Promise.all([
                financeService.getFinancialRecords({
                    projectId,
                    entityId: activeEntityId === 'all' ? undefined : activeEntityId || undefined
                }),
                activeEntityId !== 'all' ? entityService.getEntityById(activeEntityId) : Promise.resolve(null)
            ]);

            setRecords(recordsData);

            if (entityData) {
                const now = new Date();
                const quarter = Math.ceil((now.getMonth() + 1) / 3);
                const budget = (entityData as any)[`budget_q${quarter}`] || 0;
                setEntityBudget(budget);
            } else {
                setEntityBudget(0);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId, activeEntityId]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const addRecord = async (record: Omit<FinancialRecord, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const newRecord = await financeService.createFinancialRecord(record);
            setRecords(prev => [newRecord, ...prev]);
            // Force sync project cost
            await financeService.syncProjectActualCost(record.project_id);
            return newRecord;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const updateRecord = async (id: string, record: Partial<FinancialRecord>) => {
        try {
            const updatedRecord = await financeService.updateFinancialRecord(id, record);
            setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
            // Force sync project cost
            if (record.project_id) {
                await financeService.syncProjectActualCost(record.project_id);
            }
            return updatedRecord;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const deleteRecord = async (id: string, pId: string) => {
        try {
            await financeService.deleteFinancialRecord(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            await financeService.syncProjectActualCost(pId);
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const summary: FinancialSummary = records.reduce((acc, r) => {
        if (r.type === 'Ingreso') acc.total_income += Number(r.amount);
        else acc.total_expenses += Number(r.amount);
        return acc;
    }, { total_income: 0, total_expenses: 0, net_profit: 0, profit_margin: 0, budget_execution: 0 });

    summary.net_profit = summary.total_income - summary.total_expenses;
    summary.profit_margin = summary.total_income > 0 ? (summary.net_profit / summary.total_income) * 100 : 0;
    summary.budget_execution = entityBudget > 0 ? (summary.total_expenses / entityBudget) * 100 : 0;

    return {
        records,
        loading,
        error,
        summary,
        entityBudget,
        addRecord,
        updateRecord,
        deleteRecord,
        refresh: fetchFinancialData
    };
}
