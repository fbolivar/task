'use client';

import {
    Bell,
    CheckCheck,
    AlertTriangle,
    Info,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowRight
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export function NotificationDropdown() {
    const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const typeIcons = {
        INFO: <Info className="w-4 h-4 text-blue-500" />,
        SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        WARNING: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        ERROR: <XCircle className="w-4 h-4 text-rose-500" />,
        ALERT: <Bell className="w-4 h-4 text-primary animate-bounce" />,
    };

    const typeBgs = {
        INFO: 'bg-blue-500/10',
        SUCCESS: 'bg-emerald-500/10',
        WARNING: 'bg-amber-500/10',
        ERROR: 'bg-rose-500/10',
        ALERT: 'bg-primary/10',
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-xl transition-all duration-300 relative ${isOpen ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground'}`}
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-lg shadow-rose-500/20">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top-right border border-white/20">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Centro de Notificaciones</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[10px] font-black text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> Marcar Todo
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-10 flex flex-col items-center justify-center space-y-3">
                                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sincronizando...</p>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => markRead(n.id)}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer group relative ${!n.is_read ? 'bg-primary/5' : ''}`}
                                    >
                                        {!n.is_read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${typeBgs[n.type]}`}>
                                                {typeIcons[n.type]}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <h4 className="text-xs font-black text-foreground truncate">{n.title}</h4>
                                                    <span className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed mb-2 line-clamp-2">
                                                    {n.message}
                                                </p>
                                                {n.link && (
                                                    <Link
                                                        href={n.link}
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary hover:gap-2 transition-all"
                                                    >
                                                        Ver Detalles <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-6 h-6 text-slate-300" />
                                </div>
                                <h4 className="text-sm font-black text-foreground">Sin novedades</h4>
                                <p className="text-xs text-muted-foreground mt-1">El ecosistema está en calma. No hay alertas pendientes por ahora.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-center">
                        <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                            Ver Historial Completo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
