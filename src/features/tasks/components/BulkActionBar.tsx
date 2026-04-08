'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Archive, CheckCircle2, Flag } from 'lucide-react';

interface BulkActionBarProps {
    selectedCount: number;
    onChangeStatus: (status: string) => void;
    onChangePriority: (priority: string) => void;
    onArchive: () => void;
    onClearSelection: () => void;
}

const STATUS_OPTIONS = ['Pendiente', 'En Progreso', 'Revisión', 'Completado'] as const;
const PRIORITY_OPTIONS = ['Alta', 'Media', 'Baja'] as const;

type DropdownType = 'status' | 'priority' | null;

export function BulkActionBar({
    selectedCount,
    onChangeStatus,
    onChangePriority,
    onArchive,
    onClearSelection,
}: BulkActionBarProps) {
    const [openDropdown, setOpenDropdown] = useState<DropdownType>(null);
    const barRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (barRef.current && !barRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (status: string) => {
        onChangeStatus(status);
        setOpenDropdown(null);
    };

    const handlePrioritySelect = (priority: string) => {
        onChangePriority(priority);
        setOpenDropdown(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completado': return 'text-emerald-400';
            case 'En Progreso': return 'text-blue-400';
            case 'Revisión': return 'text-amber-400';
            default: return 'text-slate-400';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Alta': return 'text-orange-400';
            case 'Media': return 'text-blue-400';
            default: return 'text-slate-400';
        }
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
            aria-label="Acciones en masa"
        >
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-slate-900/80 dark:bg-slate-950/85 backdrop-blur-xl shadow-2xl shadow-black/40">

                {/* Selected count */}
                <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                    <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-white leading-none">{selectedCount}</span>
                    </div>
                    <span className="text-[11px] font-black text-white/80 uppercase tracking-widest whitespace-nowrap">
                        {selectedCount === 1 ? 'tarea seleccionada' : 'tareas seleccionadas'}
                    </span>
                </div>

                {/* Status dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdown === 'status'}
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Estado
                        <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'status' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'status' && (
                        <div
                            className="absolute bottom-full mb-2 left-0 w-40 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95"
                            role="listbox"
                            aria-label="Cambiar estado"
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusSelect(status)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all ${getStatusColor(status)}`}
                                    role="option"
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Priority dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        aria-haspopup="listbox"
                        aria-expanded={openDropdown === 'priority'}
                    >
                        <Flag className="w-3.5 h-3.5 text-orange-400 fill-current" />
                        Prioridad
                        <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'priority' ? 'rotate-180' : ''}`} />
                    </button>

                    {openDropdown === 'priority' && (
                        <div
                            className="absolute bottom-full mb-2 left-0 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95"
                            role="listbox"
                            aria-label="Cambiar prioridad"
                        >
                            {PRIORITY_OPTIONS.map((priority) => (
                                <button
                                    key={priority}
                                    onClick={() => handlePrioritySelect(priority)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all ${getPriorityColor(priority)}`}
                                    role="option"
                                >
                                    {priority}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" aria-hidden="true" />

                {/* Archive button */}
                <button
                    onClick={onArchive}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    aria-label={`Archivar ${selectedCount} tarea${selectedCount !== 1 ? 's' : ''}`}
                >
                    <Archive className="w-3.5 h-3.5" />
                    Archivar
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-white/10" aria-hidden="true" />

                {/* Clear selection */}
                <button
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
