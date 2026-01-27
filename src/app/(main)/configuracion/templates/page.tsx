'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Bell, Save, CheckCircle2, AlertTriangle, FileText, Loader2, ToggleLeft, ToggleRight, Layout, Users, Zap } from 'lucide-react';

interface EmailTemplate {
    id: string;
    code: string;
    name: string;
    category: string;
    subject: string | null;
    body_html: string;
    variables: string[];
    is_active: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
    'usuarios': Users,
    'tareas': CheckCircle2,
    'cambios': Zap,
    'general': Layout,
    'email': Mail,
    'alert': Bell
};

const CATEGORY_LABELS: Record<string, string> = {
    'usuarios': 'Gestión de Usuarios',
    'tareas': 'Control de Tareas',
    'cambios': 'Gestión de Cambios',
    'general': 'Configuración General',
    'email': 'Correos Electrónicos',
    'alert': 'Alertas del Sistema'
};

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

    // Form state for editing
    const [editSubject, setEditSubject] = useState('');
    const [editBody, setEditBody] = useState('');
    const [editActive, setEditActive] = useState(true);

    const supabase = createClient();

    const categories = useMemo(() => {
        const unique = Array.from(new Set(templates.map((t: EmailTemplate) => t.category)));
        return unique.sort();
    }, [templates]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0]);
        }
    }, [categories, activeCategory]);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('name');

        if (data) {
            setTemplates(data);
            const initialCat = data[0]?.category;
            if (initialCat) {
                setActiveCategory(initialCat);
                const firstTemplate = data.find((t: EmailTemplate) => t.category === initialCat);
                if (firstTemplate) selectTemplate(firstTemplate);
            }
        }
        setLoading(false);
    };

    const selectTemplate = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setEditSubject(template.subject || '');
        setEditBody(template.body_html);
        setEditActive(template.is_active);
    };

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        const firstOfCategory = templates.find(t => t.category === cat);
        if (firstOfCategory) {
            selectTemplate(firstOfCategory);
        } else {
            setSelectedTemplate(null);
        }
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setSaving(true);

        const { error } = await supabase
            .from('email_templates')
            .update({
                subject: editSubject || null,
                body_html: editBody,
                is_active: editActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedTemplate.id);

        if (!error) {
            setTemplates(prev => prev.map((t: EmailTemplate) =>
                t.id === selectedTemplate.id
                    ? { ...t, subject: editSubject || null, body_html: editBody, is_active: editActive }
                    : t
            ));
            setSelectedTemplate(prev => prev ? { ...prev, subject: editSubject || null, body_html: editBody, is_active: editActive } : null);
        } else {
            console.error('Error saving template:', error);
            alert('Error guardando cambios');
        }
        setSaving(false);
    };

    const filteredTemplates = templates.filter((t: EmailTemplate) => t.category === activeCategory);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Plantillas de Comunicación</h2>
                    <p className="text-muted-foreground text-sm font-medium">Personaliza los flujos de mensajería del ecosistema TASK</p>
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-2xl flex items-center gap-2 border border-primary/20">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Motor de Notificaciones Activo</span>
                </div>
            </div>

            {/* Categories Navigation */}
            <div className="flex flex-wrap gap-4 border-b border-border">
                {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat] || FileText;
                    return (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`pb-4 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all uppercase tracking-tighter ${activeCategory === cat
                                ? 'text-primary border-primary'
                                : 'text-muted-foreground border-transparent hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {CATEGORY_LABELS[cat] || cat}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-5 space-y-3">
                        <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-4">Plantillas Disponibles</h3>
                        {filteredTemplates.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay plantillas en esta categoría</p>
                        )}
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => selectTemplate(template)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTemplate?.id === template.id
                                    ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5 scale-[1.02]'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-black uppercase ${selectedTemplate?.id === template.id ? 'text-primary' : 'text-foreground'}`}>
                                        {template.name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {!template.is_active && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                                        {selectedTemplate?.id === template.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                </div>
                                <p className="text-[9px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">{template.code}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Editor Surface */}
                <div className="lg:col-span-3">
                    {selectedTemplate ? (
                        <div className="glass-card p-8 space-y-8 border-2 border-primary/10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                        <h3 className="font-black text-xl uppercase tracking-tight">
                                            {selectedTemplate.name}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] ml-3">Editor de Contenido Estructurado</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setEditActive(!editActive)}
                                    className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${editActive
                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-transparent'
                                        }`}
                                >
                                    {editActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                    {editActive ? 'Estado: ACTIVO' : 'Estado: INACTIVO'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {(selectedCategoryIsEmail(selectedTemplate) || editSubject) && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asunto del Correo</label>
                                        <input
                                            type="text"
                                            value={editSubject}
                                            onChange={(e) => setEditSubject(e.target.value)}
                                            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold"
                                            placeholder="Ingresa el asunto..."
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estructura HTML / Cuerpo del Mensaje</label>
                                        <span className="text-[9px] font-black text-primary uppercase bg-primary/5 px-2 py-1 rounded-md border border-primary/10">Engine: Liquid-like Syntax</span>
                                    </div>
                                    <textarea
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        className="w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono text-xs leading-relaxed min-h-[400px] shadow-inner"
                                        placeholder="<html>...</html>"
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex gap-2">
                                        {selectedTemplate.variables?.map(v => (
                                            <span key={v} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase text-muted-foreground border border-slate-200 dark:border-slate-700">
                                                {`{{${v}}}`}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn-primary px-8 py-3 flex items-center gap-3 shadow-xl shadow-primary/20"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        <span className="font-black uppercase tracking-widest text-[11px]">Publicar Cambios</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[500px] border-dashed border-2 border-slate-200">
                            <FileText className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Selecciona un componente para editar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function selectedCategoryIsEmail(template: EmailTemplate) {
    // In this DB schema, almost everything is email, but we adjust if category implies it
    return template.subject !== null;
}
