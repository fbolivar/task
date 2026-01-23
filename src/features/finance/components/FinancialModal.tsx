'use client';

import { useState, useEffect } from 'react';
import { X, Save, TrendingUp, TrendingDown, Calendar, Tag, FileText, DollarSign } from 'lucide-react';
import { FinancialRecordType } from '../types';
import { createClient } from '@/lib/supabase/client';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<any>;
}

const CATEGORIES = {
    Ingreso: ['Facturación', 'Inversión', 'Otros Ingresos'],
    Gasto: ['Nómina', 'Servicios Cloud', 'Marketing', 'Hardware', 'Viáticos', 'Oficina', 'Otros Gastos']
};

export function FinancialModal({ isOpen, onClose, onSave }: Props) {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        project_id: '',
        entity_id: '',
        type: 'Gasto' as FinancialRecordType,
        category: 'Nómina',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('projects').select('id, name, entity_id').order('name');
            if (data) setProjects(data);
        };
        fetchProjects();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const project = projects.find(p => p.id === formData.project_id);
            await onSave({
                ...formData,
                amount: Number(formData.amount),
                entity_id: project?.entity_id
            });
            onClose();
        } catch (error) {
            console.error('Error saving record:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-background border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" /> Nuevo Registro Financiero
                        </h2>
                        <p className="text-xs text-muted-foreground font-bold uppercase mt-1">Control de Rentabilidad de Proyecto</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'Ingreso', category: CATEGORIES.Ingreso[0] }))}
                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'Ingreso' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border'}`}
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span className="font-black uppercase text-xs">Ingreso</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'Gasto', category: CATEGORIES.Gasto[0] }))}
                            className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.type === 'Gasto' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-muted/20 border-border/50 text-muted-foreground hover:border-border'}`}
                        >
                            <TrendingDown className="w-5 h-5" />
                            <span className="font-black uppercase text-xs">Gasto</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <FormField label="Proyecto Asociado" icon={<Tag className="w-4 h-4" />}>
                            <select
                                required
                                value={formData.project_id}
                                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                                className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                            >
                                <option value="">Seleccionar Proyecto...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Categoría" icon={<FileText className="w-4 h-4" />}>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                >
                                    {CATEGORIES[formData.type].map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Fecha" icon={<Calendar className="w-4 h-4" />}>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                                />
                            </FormField>
                        </div>

                        <FormField label="Monto total ($)" icon={<DollarSign className="w-4 h-4" />}>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-black text-lg"
                            />
                        </FormField>

                        <FormField label="Descripción / Concepto" icon={<FileText className="w-4 h-4" />}>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-muted/50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold min-h-[80px]"
                                placeholder="Detalles de la transacción..."
                            />
                        </FormField>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-muted transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary text-white px-8 py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : <><Save className="w-4 h-4" /> Registrar Transacción</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormField({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 ml-1">
                {icon}
                {label}
            </label>
            {children}
        </div>
    );
}
