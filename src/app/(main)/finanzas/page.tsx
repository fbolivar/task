'use client';

import { useState } from 'react';
import { Plus, DollarSign, Download, Filter, Search, Sparkles } from 'lucide-react';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { FinancialSummary } from '@/features/finance/components/FinancialSummary';
import { FinancialList } from '@/features/finance/components/FinancialList';
import { FinancialModal } from '@/features/finance/components/FinancialModal';
import { generateFinancialReport } from '@/features/finance/utils/financeReportGenerator';
import { useAuthStore } from '@/features/auth/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { useSettings } from '@/shared/contexts/SettingsContext';

import { FinancialRecord } from '@/features/finance/types';

export default function FinancePage() {
    const { t } = useSettings();
    const { records, loading, summary, addRecord, updateRecord, deleteRecord } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeEntityName, setActiveEntityName] = useState('Consolidado');
    const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
    const activeEntityId = useAuthStore(state => state.activeEntityId);

    // Fetch entity name for the report
    useState(() => {
        const fetchName = async () => {
            if (activeEntityId === 'all') {
                setActiveEntityName('Ecosistema Corporativo');
                return;
            }
            const supabase = createClient();
            const { data } = await supabase.from('entities').select('name').eq('id', activeEntityId).single();
            if (data) setActiveEntityName(data.name);
        };
        fetchName();
    });

    const handleEdit = (record: FinancialRecord) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (editingRecord) {
            await updateRecord(editingRecord.id, data);
        } else {
            await addRecord(data);
        }
    };

    const handleOpenCreate = () => {
        setEditingRecord(null);
        setIsModalOpen(true);
    };

    const filteredRecords = records.filter(r =>
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-10 animate-reveal max-w-7xl mx-auto pb-20">
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-5 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full transition-all group-hover:scale-150 duration-700" />
                        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
                            <DollarSign className="w-8 h-8" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Intelligence Finance</span>
                        </div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">{t('finance.title')}</h1>
                        <p className="text-muted-foreground font-medium text-sm mt-3 uppercase tracking-widest opacity-60">{t('finance.desc')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300 group-focus-within:scale-110" />
                        <input
                            type="text"
                            placeholder={t('finance.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-[320px] pl-12 pr-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all text-sm font-semibold outline-none shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        <span className="hidden md:inline font-bold tracking-wide">{t('finance.new')}</span>
                    </button>
                    <button
                        onClick={() => generateFinancialReport(filteredRecords, summary, activeEntityName)}
                        className="p-4 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all shadow-sm"
                        title="Exportar Reporte de Rentabilidad (PDF)"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* --- Stats Summary --- */}
            <FinancialSummary summary={summary} />

            {/* --- Control Bar --- */}
            <div className="flex items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Filter className="w-4 h-4" />
                    </div>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        {t('finance.cashFlow')}
                    </h2>
                    <span className="bg-primary/10 px-3 py-1 rounded-full text-[9px] font-black text-primary uppercase tracking-widest border border-primary/10">
                        {filteredRecords.length} {t('finance.records')}
                    </span>
                </div>
            </div>

            {/* --- Data List --- */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card-premium h-32 animate-pulse bg-slate-100/50 dark:bg-white/5" />
                    ))}
                </div>
            ) : (
                <FinancialList records={filteredRecords} onDelete={deleteRecord} onEdit={handleEdit} />
            )}

            {/* --- Creation Modal --- */}
            <FinancialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingRecord}
            />
        </div>
    );
}
