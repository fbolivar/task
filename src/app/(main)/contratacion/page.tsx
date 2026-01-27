'use client';

import React, { useState } from 'react';
import { useHiring } from '@/features/hiring/hooks/useHiring';
import { HiringBoard } from '@/features/hiring/components/HiringBoard';
import { HiringModal } from '@/features/hiring/components/HiringModal';
import { HiringProcess, HiringProcessFormData } from '@/features/hiring/types';
import { FileText, Plus, Search, Loader2, Target, TrendingUp, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function ContratacionPage() {
    const { processes, loading, createProcess, updateProcess, updatePhase, deleteProcess } = useHiring();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState<HiringProcess | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { user, profile, activeEntityId } = useAuthStore();
    const isReadOnly = profile?.role?.name === 'Gerente';

    const filteredProcesses = processes.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenCreate = () => {
        setEditingProcess(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (process: HiringProcess) => {
        setEditingProcess(process);
        setIsModalOpen(true);
    };

    const handleSave = async (data: HiringProcessFormData) => {
        if (editingProcess) {
            await updateProcess(editingProcess.id, data);
        } else {
            await createProcess(data);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este proceso de contratación?')) {
            await deleteProcess(id);
        }
    };

    if (loading && processes.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-reveal">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Sincronizando Protocolos de Contratación</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-reveal">
            {/* Executive Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <Target className="w-10 h-10" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-foreground tracking-tighter leading-tight">Módulo de Contratación</h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-500">
                                <ShieldCheck className="w-4 h-4" /> Gestión Blindada
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <p className="text-muted-foreground font-bold text-sm">Control de fases y porcentajes de ejecución</p>
                        </div>
                    </div>
                </div>

                {!isReadOnly && (
                    <button
                        onClick={handleOpenCreate}
                        className="group bg-slate-900 dark:bg-primary hover:bg-black dark:hover:bg-primary/80 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-2xl flex items-center gap-4 transition-all hover:translate-y-[-4px] active:translate-y-[0px] active:scale-95"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Iniciar Nuevo Proceso
                    </button>
                )}

                {isReadOnly && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5" />
                        Modo Observador (Gerencia)
                    </div>
                )}
            </div>

            {/* Operations Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por título de proceso o proyecto vinculado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-8 focus:ring-primary/5 transition-all text-sm font-bold placeholder:text-muted-foreground/50 outline-none shadow-sm"
                    />
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/20 rounded-3xl p-6 flex flex-col justify-center items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Ejecución Activa</p>
                    </div>
                    <p className="text-3xl font-black text-primary leading-none tracking-tighter">{processes.length} Procesos</p>
                </div>
            </div>

            {/* Main Content Area */}
            {
                filteredProcesses.length > 0 ? (
                    <HiringBoard
                        processes={filteredProcesses}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        readOnly={isReadOnly}
                    />
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-24 flex flex-col items-center text-center group">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="relative w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700/50">
                                <FileText className="w-16 h-16 text-slate-300 group-hover:text-primary transition-colors duration-500" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-foreground tracking-tight">Cero Procesos en Radar</h3>
                        <p className="text-muted-foreground mt-4 max-w-sm font-medium leading-relaxed">
                            No se han detectado procesos de contratación activos bajo estos criterios de filtrado.
                        </p>
                        <button
                            onClick={handleOpenCreate}
                            className="mt-10 btn-primary px-8"
                        >
                            Comenzar Ahora
                        </button>
                    </div>
                )
            }

            {/* Contextual Modal */}
            <HiringModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                onUpdatePhase={updatePhase}
                process={editingProcess}
                entityId={activeEntityId || ''}
                readOnly={isReadOnly}
            />
        </div >
    );
}
