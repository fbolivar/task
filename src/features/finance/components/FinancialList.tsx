'use client';

import { FinancialRecord } from '../types';
import { Trash2, TrendingUp, TrendingDown, Calendar, Building2, Briefcase } from 'lucide-react';

interface Props {
    records: FinancialRecord[];
    onDelete: (id: string, projectId: string) => Promise<void>;
}

export function FinancialList({ records, onDelete }: Props) {
    if (records.length === 0) {
        return (
            <div className="glass-card p-20 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <TrendingUp className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <h3 className="text-xl font-black text-foreground uppercase">Sin Transacciones</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    No se han registrado movimientos financieros para la entidad o proyecto seleccionado.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border">
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Concepto / Descripción</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Categoría</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Proyecto / Entidad</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fecha</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Monto</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-muted/20 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${record.type === 'Ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {record.type === 'Ingreso' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground leading-tight">{record.description || 'Sin descripción'}</p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground/60">{record.type}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-muted-foreground border border-border">
                                        {record.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                            <Briefcase className="w-3 h-3 text-primary" />
                                            {record.project?.name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase">
                                            <Building2 className="w-3 h-3" />
                                            {record.entity?.name}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(record.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`text-sm font-black ${record.type === 'Ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {record.type === 'Ingreso' ? '+' : '-'}${Number(record.amount).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => {
                                                if (confirm('¿Seguro que desea eliminar esta transacción?')) {
                                                    onDelete(record.id, record.project_id);
                                                }
                                            }}
                                            className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-600/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
