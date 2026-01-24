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
    Calendar,
    DollarSign,
    Sparkles,
    Zap
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
        Prospecto: 'from-amber-400 to-orange-500 text-white',
        Cliente: 'from-emerald-400 to-teal-500 text-white',
        Partner: 'from-blue-400 to-indigo-500 text-white',
    };

    const typeBadges = {
        Prospecto: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        Cliente: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        Partner: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };

    return (
        <div className="card-premium group relative flex flex-col h-full hover:translate-y-[-8px] transition-all duration-500">
            {/* Top Bar Accent */}
            <div className={`absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r ${typeColors[entity.type]} z-20`} />

            <div className="p-8 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 group-hover:scale-105 ${typeBadges[entity.type]}`}>
                        {entity.type}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-muted-foreground transition-all hover:scale-110"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-3 w-40 glass-card shadow-2xl z-20 p-1.5 border border-white/20 animate-in fade-in zoom-in-95">
                                <button
                                    onClick={() => { onEdit(entity); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" /> Modificar
                                </button>
                                <button
                                    onClick={() => { onDelete(entity.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                                >
                                    <Trash2 className="w-4 h-4" /> Archivar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-5 mb-8">
                    <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${typeColors[entity.type]} blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700`} />
                        <div className={`relative w-16 h-16 rounded-3xl bg-gradient-to-br ${typeColors[entity.type]} flex items-center justify-center text-white font-black text-2xl shadow-xl ring-4 ring-white dark:ring-slate-900 group-hover:rotate-6 transition-transform duration-500 overflow-hidden`}>
                            {entity.logo_url ? (
                                <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-cover" />
                            ) : (
                                entity.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-xl text-foreground tracking-tight truncate group-hover:text-primary transition-all leading-tight mb-2">
                            {entity.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70 font-black uppercase tracking-widest">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span className="truncate">{entity.address || 'Global Operations'}</span>
                        </div>
                    </div>
                </div>

                {/* --- Budget Execution (Enhanced) --- */}
                <div className="mb-8 p-6 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-inner">
                    {(() => {
                        const now = new Date();
                        const quarter = Math.ceil((now.getMonth() + 1) / 3);
                        const budget = (entity as any)[`budget_q${quarter}`] || 0;
                        const expenses = (entity as any).current_q_expenses || 0;
                        const percent = budget > 0 ? (expenses / budget) * 100 : 0;
                        const isCritical = percent >= 90;

                        return (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                                        <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" /> Q{quarter} Performance
                                    </div>
                                    <span className={`text-[12px] font-black tracking-tighter ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {percent.toFixed(0)}%
                                    </span>
                                </div>

                                <div className="h-2 w-full bg-slate-200/50 dark:bg-white/10 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-spring ${isCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-foreground">${expenses.toLocaleString()}</span>
                                    <span className="text-muted-foreground/50">Plan: ${budget.toLocaleString()}</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                <div className="space-y-4">
                    <ContactItem icon={<Mail />} text={entity.contact_info?.email || 'Falta Correo'} />
                    <ContactItem icon={<Phone />} text={entity.contact_info?.phone || 'Sin Teléfono'} />
                    {entity.website && (
                        <a
                            href={entity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 text-xs font-black text-primary hover:text-indigo-600 transition-colors group/link uppercase tracking-widest"
                        >
                            <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center group-hover/link:bg-primary/20 group-hover/link:scale-110 transition-all border border-primary/10">
                                <Globe className="w-4 h-4" />
                            </div>
                            <span className="truncate text-[10px]">{entity.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                    )}
                </div>
            </div>

            {/* Footer with Stakeholder info */}
            <div className="px-8 py-5 bg-slate-50/30 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 mt-auto rounded-b-[2rem]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 group/user">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/user:opacity-100 transition-opacity" />
                            <div className="relative w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-primary font-black text-[12px] shadow-sm">
                                {entity.contact_name ? entity.contact_name.charAt(0) : <User className="w-4 h-4" />}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest leading-none mb-1.5">Key Account</p>
                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight truncate max-w-[120px]">{entity.contact_name || 'Unassigned'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {new Date(entity.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ContactItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-4 text-xs group/item cursor-default">
            <div className="w-8 h-8 rounded-xl bg-slate-100/50 dark:bg-white/5 flex items-center justify-center group-hover/item:bg-primary/10 group-hover/item:scale-110 transition-all border border-slate-100 dark:border-white/5">
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors" })}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover/item:text-foreground transition-colors truncate">{text}</span>
        </div>
    );
}
