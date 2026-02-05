'use client';

import { useState, useEffect } from 'react';
import { Send, History, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { TaskFollowup } from '../types';
import { trackingService } from '../services/trackingService';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface TrackingSectionProps {
    taskId: string;
}

export function TrackingSection({ taskId }: TrackingSectionProps) {
    const { t } = useSettings();
    const [followups, setFollowups] = useState<TaskFollowup[]>([]);

    // Form State
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [progress, setProgress] = useState('');
    const [issues, setIssues] = useState('');

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const fetchFollowups = async () => {
        try {
            setLoading(true);
            const data = await trackingService.getFollowups(taskId);
            setFollowups(data);
        } catch (error) {
            console.error('Error loading followups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchFollowups();
        }
    }, [taskId]);

    const handleSend = async () => {
        if (!progress.trim() || !reportDate) return;

        try {
            setSending(true);
            const newItem = await trackingService.addFollowup(taskId, reportDate, progress, issues);
            setFollowups(prev => [newItem, ...prev]);

            // Reset form (keep date)
            setProgress('');
            setIssues('');
        } catch (error) {
            console.error('Error adding followup:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <History className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Bitácora de Seguimiento</h3>
            </div>

            {/* Input Form */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Nuevo Registro</h4>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Fecha del Reporte</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-primary text-sm font-bold"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-green-600 dark:text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Descripción del Avance
                    </label>
                    <textarea
                        value={progress}
                        onChange={(e) => setProgress(e.target.value)}
                        placeholder="¿Qué se logró avanzar?"
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-green-500 min-h-[80px] text-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Limitantes o Problemas (Opcional)
                    </label>
                    <textarea
                        value={issues}
                        onChange={(e) => setIssues(e.target.value)}
                        placeholder="¿Hubo algún bloqueo o dificultad?"
                        className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-amber-500 min-h-[60px] text-sm"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSend}
                        disabled={sending || !progress.trim()}
                        className="btn-primary py-2 px-6 text-sm font-bold flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Registrar Avance
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Cargando bitácora...</div>
                ) : followups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No hay registros de seguimiento aún.
                    </div>
                ) : (
                    followups.map((item) => (
                        <div key={item.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-slate-800 last:pb-0">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {item.report_date}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        por <strong>{item.user?.full_name || 'Desconocido'}</strong>
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Progress Card */}
                                    <div className="bg-green-50/50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/20">
                                        <h5 className="text-xs font-black text-green-700 dark:text-green-500 mb-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> AVANCE
                                        </h5>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">{item.content_progress}</p>
                                    </div>

                                    {/* Issues Card - Only if exists */}
                                    {item.content_issues && (
                                        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                                            <h5 className="text-xs font-black text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> LIMITANTES
                                            </h5>
                                            <p className="text-sm text-foreground whitespace-pre-wrap">{item.content_issues}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
