'use client';

import {
    Mail,
    Shield,
    Layers,
    Edit2,
    Trash2,
    Power,
    CheckCircle2,
    XCircle,
    Building2,
    User
} from 'lucide-react';
import { UserProfile } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface UserTableProps {
    users: UserProfile[];
    onEdit: (user: UserProfile) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string, current: boolean) => void;
}

export function UserTable({ users, onEdit, onDelete, onToggleStatus }: UserTableProps) {
    const { t } = useSettings();
    return (
        <div className="glass-card overflow-hidden border border-white/20 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t('users.table.member')}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t('users.table.role')}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{t('users.table.access')}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-center">{t('users.table.status')}</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground text-right">{t('users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center text-primary font-black border border-primary/10 group-hover:scale-110 transition-transform">
                                            {user.full_name?.charAt(0) || <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-foreground">{user.full_name || 'Sin Nombre'}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <Mail className="w-3 h-3" /> {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${user.role?.name === 'Admin'
                                        ? 'bg-red-500/10 text-red-600 border-red-500/20'
                                        : user.role?.name === 'Gerente'
                                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                        }`}>
                                        <Shield className="w-3 h-3" />
                                        {user.role?.name || t('users.role.guest')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.has_all_entities_access ? (
                                        <span className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-lg w-fit">
                                            <Layers className="w-3 h-3" /> {t('users.access.full')}
                                        </span>
                                    ) : (
                                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                                            {user.profile_entities && user.profile_entities.length > 0 ? (
                                                user.profile_entities.slice(0, 2).map((pe, i) => (
                                                    <span key={i} className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate">
                                                        {pe.entity.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground italic">{t('users.access.none')}</span>
                                            )}
                                            {user.profile_entities && user.profile_entities.length > 2 && (
                                                <span className="text-[9px] font-bold text-primary">+{user.profile_entities.length - 2} {t('users.access.more')}</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        {user.is_active ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                                                <CheckCircle2 className="w-4 h-4" /> {t('users.status.active')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-tighter">
                                                <XCircle className="w-4 h-4" /> {t('users.status.inactive')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onToggleStatus(user.id, user.is_active)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-muted-foreground hover:text-primary transition-colors tooltip"
                                            title={user.is_active ? t('users.action.deactivate') : t('users.action.activate')}
                                        >
                                            <Power className={`w-4 h-4 ${!user.is_active ? 'text-primary' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-muted-foreground hover:text-amber-600 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
