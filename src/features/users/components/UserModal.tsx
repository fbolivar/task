'use client';

import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    User,
    Mail,
    Lock,
    Shield,
    Layers,
    Check,
    Building2,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-react';
import { UserProfile, UserFormData, Role, EntityShort } from '../types';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: UserFormData) => Promise<void>;
    user?: UserProfile | null;
    roles: Role[];
    entities: EntityShort[];
}

const initialFormData: UserFormData = {
    full_name: '',
    email: '',
    role_id: '',
    is_active: true,
    has_all_entities_access: false,
    entity_ids: [],
    password: '',
};

export function UserModal({ isOpen, onClose, onSave, user, roles, entities }: UserModalProps) {
    const [formData, setFormData] = useState<UserFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                role_id: user.role_id || '',
                is_active: user.is_active,
                has_all_entities_access: user.has_all_entities_access,
                entity_ids: user.profile_entities?.map(pe => pe.entity.id) || [],
                password: '', // Password shouldn't be revealed
            });
        } else {
            setFormData(initialFormData);
        }
    }, [user, isOpen]);

    const toggleEntity = (entityId: string) => {
        setFormData(prev => ({
            ...prev,
            entity_ids: prev.entity_ids.includes(entityId)
                ? prev.entity_ids.filter(id => id !== entityId)
                : [...prev.entity_ids, entityId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error in user saving:', error);
            alert(error instanceof Error ? error.message : 'Error al guardar usuario');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-2xl animate-in zoom-in-95 duration-300">
                {/* Executive Header */}
                <div className="p-8 bg-gradient-to-br from-slate-800 to-black text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center bg-slate-900 overflow-hidden">
                            <User className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">
                                {user ? 'Actualizar Credenciales' : 'Registrar Nuevo Talento'}
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-md border border-primary/30">
                                    Control de Acceso
                                </span>
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    Directiva de Seguridad V3
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white dark:bg-slate-900">
                    {/* Left Column: Core Data */}
                    <div className="space-y-8">
                        <SectionTitle title="Información Primaria" />

                        <div className="space-y-4">
                            <FormField label="Nombre Completo" icon={<User />}>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="input-premium"
                                    placeholder="Ej: Alejandro Magno"
                                    required
                                />
                            </FormField>

                            <FormField label="Correo Electrónico Corporativo" icon={<Mail />}>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-premium"
                                    placeholder="alejandro@empresa.com"
                                    required
                                    disabled={!!user}
                                />
                            </FormField>

                            {!user && (
                                <FormField label="Contraseña Inicial" icon={<Lock />}>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="input-premium pr-12"
                                            placeholder="••••••••"
                                            required={!user}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormField>
                            )}

                            <FormField label="Rol Administrativo" icon={<Shield />}>
                                <select
                                    value={formData.role_id}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                    className="input-premium appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">Seleccionar Rol...</option>
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    </div>

                    {/* Right Column: Entity Permissions */}
                    <div className="space-y-8">
                        <SectionTitle title="Permisos de Ecosistema" />

                        <div className="space-y-6">
                            <label className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <Layers className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-wider text-foreground">Acceso Global</p>
                                        <p className="text-[10px] text-muted-foreground font-medium">Permitir ver TODAS las entidades del sistema</p>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={formData.has_all_entities_access}
                                    onChange={(e) => setFormData({ ...formData, has_all_entities_access: e.target.checked })}
                                    className="w-5 h-5 accent-primary cursor-pointer"
                                />
                            </label>

                            {!formData.has_all_entities_access && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Seleccionar Entidades Autorizadas</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {entities.map(entity => (
                                            <button
                                                key={entity.id}
                                                type="button"
                                                onClick={() => toggleEntity(entity.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.entity_ids.includes(entity.id)
                                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-foreground hover:border-primary/50'
                                                    }`}
                                            >
                                                <Building2 className={`w-4 h-4 ${formData.entity_ids.includes(entity.id) ? 'text-white' : 'text-muted-foreground'}`} />
                                                <span className="text-[11px] font-black truncate flex-1">{entity.name}</span>
                                                {formData.entity_ids.includes(entity.id) && <Check className="w-3.5 h-3.5" />}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.entity_ids.length === 0 && (
                                        <p className="text-[10px] font-bold text-red-500 italic">Debe seleccionar al menos una entidad o marcar acceso global.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Full Width Actions */}
                    <div className="md:col-span-2 flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-mono"
                        >
                            Abortar Operación
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || (!formData.has_all_entities_access && formData.entity_ids.length === 0)}
                            className="flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-primary text-white shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {user ? 'Guardar Cambios de Perfil' : 'Ejecutar Alta de Funcionario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SectionTitle({ title }: { title: string }) {
    return (
        <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-8 h-[2px] bg-primary/20" /> {title}
        </h4>
    );
}

function FormField({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                {label}
            </label>
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                </div>
                {children}
            </div>
        </div>
    );
}
