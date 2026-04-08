'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, CheckCircle2, Download } from 'lucide-react';
import { AssetStatus } from '../types';

interface AssetBulkBarProps {
    selectedCount: number;
    onChangeStatus: (status: AssetStatus) => void;
    onExportSelected: () => void;
    onClearSelection: () => void;
}

const STATUS_OPTIONS: AssetStatus[] = ['Disponible', 'Asignado', 'Mantenimiento', 'Baja'];

const STATUS_COLORS: Record<AssetStatus, string> = {
    'Disponible': 'text-emerald-400',
    'Asignado': 'text-indigo-400',
    'Mantenimiento': 'text-amber-400',
    'Baja': 'text-rose-400',
};

export function AssetBulkBar({
    selectedCount,
    onChangeStatus,
    onExportSelected,
    onClearSelection,
}: AssetBulkBarProps) {
    const [statusOpen, setStatusOpen] = useState(false);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (barRef.current && !barRef.current.contains(event.target as Node)) {
                setStatusOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (status: AssetStatus) => {
        onChangeStatus(status);
        setStatusOpen(false);
    };

    return (
        <div
            className={`fixed bottom-6 left-1/2 z-50 transition-all duration-500 ease-out ${
                selectedCount > 0
                    ? 'translate-x-[-50%] translate-y-0 opacity-100 pointer-events-auto'
                    : 'translate-x-[-50%] translate-y-16 opacity-0 pointer-events-none'
            }`}
            ref={barRef}
            role="toolbar"
            aria-label="Acciones en masa de activos"
        >
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/40">

                {/* Selected count */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                    <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-white leading-none">{selectedCount}</span>
                    </div>
                    <span className="text-[11px] font-black text-white/80 uppercase tracking-widest whitespace-nowrap">
                        {selectedCount === 1 ? 'activo seleccionado' : 'activos seleccionados'}
                    </span>
                </div>

                {/* Status dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setStatusOpen((prev) => !prev)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        aria-haspopup="listbox"
                        aria-expanded={statusOpen}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Estado
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {statusOpen && (
                        <div
                            className="absolute bottom-full mb-2 left-0 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150"
                            role="listbox"
                            aria-label="Cambiar estado"
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusSelect(status)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all ${STATUS_COLORS[status]}`}
                                    role="option"
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" aria-hidden="true" />

                {/* Export selected */}
                <button
                    type="button"
                    onClick={onExportSelected}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-400/80 hover:text-sky-400 hover:bg-sky-500/10 transition-all"
                    aria-label={`Exportar ${selectedCount} activo${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}`}
                >
                    <Download className="w-3.5 h-3.5" />
                    Exportar
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" aria-hidden="true" />

                {/* Clear selection */}
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Limpiar selección"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
