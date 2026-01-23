'use client';

import {
    Mail,
    Phone,
    MapPin,
    Globe,
    User,
    Trash2,
    Edit2,
    MoreVertical,
    Building2,
    Calendar,
    DollarSign,
    TrendingUp
} from 'lucide-react';
import React, { useState } from 'react';
import { Entity } from '../types';

interface EntityCardProps {
    entity: Entity;
    onEdit: (entity: Entity) => void;
    onDelete: (id: string) => void;
}

export function EntityCard({ entity, onEdit, onDelete }: EntityCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const typeColors = {
        Prospecto: 'from-amber-400 to-orange-500 text-white shadow-amber-500/20',
        Cliente: 'from-emerald-400 to-teal-500 text-white shadow-emerald-500/20',
        Partner: 'from-blue-400 to-indigo-500 text-white shadow-blue-500/20',
    };

    const typeBadges = {
        Prospecto: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        Cliente: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Partner: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };

    return (
        <div className="glass-card group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden border border-white/20 flex flex-col h-full bg-white/40 dark:bg-slate-900/40">
            {/* Top Bar Accent */}
            <div className={`h-1 w-full bg-gradient-to-r ${typeColors[entity.type]}`} />

            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-colors ${typeBadges[entity.type]}`}>
                        {entity.type}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-muted-foreground transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-36 glass-card shadow-xl z-10 p-1 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => { onEdit(entity); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Editar
                                </button>
                                <button
                                    onClick={() => { onDelete(entity.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${typeColors[entity.type]} flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform duration-500`}>
                        {entity.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-lg text-foreground truncate group-hover:text-primary transition-colors">
                            {entity.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="truncate">{entity.address || 'Global / Digital'}</span>
                        </div>
                    </div>
                </div>

                {/* --- Budget Execution (New) --- */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    {(() => {
                        const now = new Date();
                        const quarter = Math.ceil((now.getMonth() + 1) / 3);
                        const budget = (entity as any)[`budget_q${quarter}`] || 0;
                        const expenses = (entity as any).current_q_expenses || 0;
                        const percent = budget > 0 ? (expenses / budget) * 100 : 0;
                        const isCritical = percent >= 90;

                        return (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                        <DollarSign className="w-3 h-3 text-primary" /> Ejecución Q{quarter}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase ${isCritical ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                                        {percent.toFixed(0)}%
                                    </span>
                                </div>

                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : 'bg-primary'}`}
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                                    <span>${expenses.toLocaleString()}</span>
                                    <span>Plan: ${budget.toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="space-y-3">
                    <ContactItem icon={<Mail />} text={entity.contact_info?.email || 'Falta Correo'} />
                    <ContactItem icon={<Phone />} text={entity.contact_info?.phone || 'Sin Teléfono'} />
                    {entity.website && (
                        <a
                            href={entity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-xs font-bold text-primary hover:underline group/link"
                        >
                            <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/20 transition-colors">
                                <Globe className="w-3.5 h-3.5" />
                            </div>
                            <span className="truncate">{entity.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Footer with Stakeholder info */}
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/20 border-t border-white/10 mt-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary font-bold text-[10px]">
                            {entity.contact_name ? entity.contact_name.charAt(0) : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter leading-none mb-0.5">Key Account</p>
                            <p className="text-[11px] font-black truncate max-w-[100px]">{entity.contact_name || 'Sin Asignar'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                        <Calendar className="w-3 h-3" />
                        {new Date(entity.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-3 text-xs group/item cursor-default">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5 text-muted-foreground group-hover/item:text-primary transition-colors" })}
            </div>
            <span className="text-muted-foreground font-bold truncate group-hover/item:text-foreground transition-colors">{text}</span>
        </div>
    );
}
