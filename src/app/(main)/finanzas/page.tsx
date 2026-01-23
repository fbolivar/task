'use client';

import { useState } from 'react';
import { Plus, DollarSign, Download, Filter, Search } from 'lucide-react';
import { useFinance } from '@/features/finance/hooks/useFinance';
import { FinancialSummary } from '@/features/finance/components/FinancialSummary';
import { FinancialList } from '@/features/finance/components/FinancialList';
import { FinancialModal } from '@/features/finance/components/FinancialModal';
import { generateFinancialReport } from '@/features/finance/utils/financeReportGenerator';
import { useAuthStore } from '@/features/auth/store/authStore';
import { createClient } from '@/lib/supabase/client';

export default function FinancePage() {
    const { records, loading, summary, addRecord, deleteRecord } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeEntityName, setActiveEntityName] = useState('Consolidado');
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

    const filteredRecords = records.filter(r =>
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-xs">
                        <DollarSign className="w-3 h-3 fill-primary" /> Intelligence Finance
                    </div>
                    <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
                        Rentabilidad <span className="text-primary">&</span> Presupuestos
                    </h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-tight">
                        Control patrimonial y flujo de caja por entidad
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar transacciones..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-muted/20 border border-border/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 w-[280px] transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary text-white p-3 md:px-6 md:py-3 rounded-2xl font-black uppercase text-xs shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden md:inline">Nueva Transacción</span>
                    </button>
                    <button
                        onClick={() => generateFinancialReport(filteredRecords, summary, activeEntityName)}
                        className="p-3 bg-muted/20 border border-border/50 rounded-2xl hover:bg-muted/40 transition-colors"
                        title="Exportar Reporte de Rentabilidad (PDF)"
                    >
                        <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* --- Stats Summary --- */}
            <FinancialSummary summary={summary} />

            {/* --- Control Bar --- */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Movimientos de Caja
                    </h2>
                    <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-black text-muted-foreground">
                        {filteredRecords.length} REGISTROS
                    </span>
                </div>
                {/* Future: Add date range filters here */}
            </div>

            {/* --- Data List --- */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card p-8 animate-pulse bg-muted/20 h-24" />
                    ))}
                </div>
            ) : (
                <FinancialList records={filteredRecords} onDelete={deleteRecord} />
            )}

            {/* --- Creation Modal --- */}
            <FinancialModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addRecord}
            />
        </div>
    );
}
