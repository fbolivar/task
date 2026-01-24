'use client';

import { FinancialRecord } from '../types';
import { Trash2, TrendingUp, TrendingDown, Calendar, Building2, Briefcase, Edit2, Zap } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface Props {
    records: FinancialRecord[];
    onDelete: (id: string, projectId: string) => Promise<void>;
    onEdit: (record: FinancialRecord) => void;
}

export function FinancialList({ records, onDelete, onEdit }: Props) {
    const { t } = useSettings();

    if (records.length === 0) {
        return (
            <div className="card-premium p-20 flex flex-col items-center justify-center text-center group">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 transition-transform group-hover:scale-[2] duration-700" />
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center border border-white/20">
                        <TrendingUp className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-foreground tracking-tight">{t('finance.empty')}</h3>
                <p className="text-sm font-medium text-muted-foreground mt-3 max-w-sm">
                    {t('finance.emptyDesc')}
                </p>
            </div>
        );
    }

    return (
        <div className="card-premium overflow-hidden p-0 border-none shadow-2xl">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t('finance.list.concept')}</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t('finance.list.category')}</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t('finance.list.project')}</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{t('finance.list.date')}</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] text-right">{t('finance.list.amount')}</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] text-center">{t('finance.list.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-500 ${record.type === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {record.type === 'Ingreso' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground leading-none mb-1.5 tracking-tight">{record.description || 'Sin descripción'}</p>
                                            <div className="flex items-center gap-1.5">
                                                <Zap className={`w-3 h-3 ${record.type === 'Ingreso' ? 'text-emerald-500' : 'text-rose-500'}`} />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{record.type === 'Ingreso' ? t('finance.income') : t('finance.expense')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100/50 dark:bg-white/5 text-muted-foreground border border-slate-200 dark:border-white/5">
                                        {record.category}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs font-black text-foreground tracking-tight">
                                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                                            {record.project?.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-tighter">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {record.entity?.name}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest">
                                        <Calendar className="w-4 h-4 text-primary/50" />
                                        {new Date(record.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <span className={`text-lg font-black tracking-tighter ${record.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {record.type === 'Ingreso' ? '+' : '-'}${Number(record.amount).toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex justify-center gap-3">
                                        <button
                                            onClick={() => onEdit(record)}
                                            className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(t('general.delete') + '?')) {
                                                    onDelete(record.id, record.project_id);
                                                }
                                            }}
                                            className="p-2.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
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
