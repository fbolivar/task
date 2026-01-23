'use client';

import { useState, useEffect } from 'react';
import {
    X,
    Save,
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    User,
    Loader2,
    ShieldCheck,
    Briefcase,
    Target,
    DollarSign
} from 'lucide-react';
import { Entity, EntityFormData, EntityType } from '../types';

interface EntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: EntityFormData) => Promise<void>;
    entity?: Entity | null;
}

const initialFormData: EntityFormData = {
    name: '',
    type: 'Prospecto',
    email: '',
    phone: '',
    website: '',
    address: '',
    contact_name: '',
    contact_email: '',
    budget_q1: 0,
    budget_q2: 0,
    budget_q3: 0,
    budget_q4: 0,
};

export function EntityModal({ isOpen, onClose, onSave, entity }: EntityModalProps) {
    const [formData, setFormData] = useState<EntityFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (entity) {
            setFormData({
                name: entity.name,
                type: entity.type,
                email: entity.contact_info?.email || '',
                phone: entity.contact_info?.phone || '',
                website: entity.website || '',
                address: entity.address || '',
                contact_name: entity.contact_name || '',
                contact_email: entity.contact_email || '',
                budget_q1: entity.budget_q1 || 0,
                budget_q2: entity.budget_q2 || 0,
                budget_q3: entity.budget_q3 || 0,
                budget_q4: entity.budget_q4 || 0,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [entity, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error in modal saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Header Profile Layer */}
                <div className="p-8 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-inner">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-1">
                                {entity ? 'Editar Perfil Corporativo' : 'Alta de Nueva Entidad'}
                            </h3>
                            <p className="text-white/70 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> Registro Oficial del Ecosistema
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-slate-900">
                    {/* General ID Card */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Razón Social / Nombre Comercial</label>
                                <div className="relative group">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-base"
                                        placeholder="Ej: Inversiones Globales S.A.S"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Relación</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as EntityType })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none"
                                    >
                                        <option value="Prospecto">🔍 Prospecto</option>
                                        <option value="Cliente">✅ Cliente</option>
                                        <option value="Partner">🤝 Partner</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Presencia Digital (Website)</label>
                                <div className="relative group">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                        placeholder="https://www.empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ubicación / Dirección Física</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                        placeholder="Calle 100 # 23-45, Bogota, Colombia"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Channels Card */}
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 space-y-6">
                        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">Canales y Stakeholders</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 md:border-r border-slate-200 dark:border-slate-700 md:pr-6">
                                <h5 className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                    <Mail className="w-3 h-3" /> Canales Corporativos
                                </h5>
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-primary focus:outline-none text-sm font-bold"
                                        placeholder="correo@empresa.com"
                                    />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-primary focus:outline-none text-sm font-bold"
                                        placeholder="+57 300 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                    <User className="w-3 h-3" /> Contacto Estratégico
                                </h5>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-primary focus:outline-none text-sm font-bold"
                                        placeholder="Nombre del Gestor"
                                    />
                                    <input
                                        type="email"
                                        value={formData.contact_email}
                                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:border-primary focus:outline-none text-sm font-bold"
                                        placeholder="email@gestor.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quarterly Budgets Card */}
                    <div className="p-6 rounded-3xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <DollarSign className="w-3.5 h-3.5" /> Planificación Presupuestaria (Trimestral)
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((q) => (
                                <div key={q} className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Presupuesto Q{q}</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="number"
                                            value={formData[`budget_q${q}` as keyof EntityFormData] || 0}
                                            onChange={(e) => setFormData({ ...formData, [`budget_q${q}`]: Number(e.target.value) })}
                                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-blue-500/10 bg-white dark:bg-slate-950 focus:border-blue-500 focus:outline-none text-sm font-black text-blue-600 dark:text-blue-400"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Descartar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-70"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {entity ? 'Actualizar Stakeholder' : 'Confirmar Alta Directa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
