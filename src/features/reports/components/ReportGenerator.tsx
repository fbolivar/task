'use client';

import {
    Calendar,
    Briefcase,
    FileDown,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Target,
    Users
} from 'lucide-react';
import { ProjectData, ReportStats } from '../types';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface ReportGeneratorProps {
    projects: ProjectData[];
    onGenerate: (projectId: string, start: string, end: string) => Promise<void>;
    stats: ReportStats | null;
    loading: boolean;
}

export function ReportGenerator({ projects, onGenerate, stats, loading }: ReportGeneratorProps) {
    const { t } = useSettings();

    return (
        <div className="space-y-6">
            <div className="glass-card overflow-hidden border-primary/10 shadow-xl">
                <div className="p-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500" />
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Selector Section */}
                        <div className="lg:col-span-4 space-y-6 lg:border-r border-slate-100 dark:border-slate-800 lg:pr-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Target className="w-5 h-5" />
                                </div>
                                <h3 className="font-black text-lg">{t('reports.analysisParams')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('reports.projectFocus')}</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <select
                                            id="report-project"
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold appearance-none"
                                        >
                                            <option value="all">{t('reports.allActiveProjects')}</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.entity_name})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('reports.from')}</label>
                                        <input
                                            type="date"
                                            id="report-start"
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('reports.to')}</label>
                                        <input
                                            type="date"
                                            id="report-end"
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        const p = (document.getElementById('report-project') as HTMLSelectElement).value;
                                        const s = (document.getElementById('report-start') as HTMLInputElement).value;
                                        const e = (document.getElementById('report-end') as HTMLInputElement).value;
                                        onGenerate(p, s, e);
                                    }}
                                    disabled={loading}
                                    className="w-full btn-primary py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <FileDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                                    )}
                                    <span className="font-bold">{t('reports.generateBtn')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="lg:col-span-8">
                            {stats ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-black text-lg flex items-center gap-2">
                                            {t('reports.previewTitle')}
                                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">{t('reports.updated')}</span>
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">{t('reports.totalTasks')}</p>
                                            <p className="text-2xl font-black text-foreground">{stats.total_tasks}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600/70 mb-1">{t('reports.completed')}</p>
                                            <p className="text-2xl font-black text-emerald-600">{stats.completed_tasks}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600/70 mb-1">{t('reports.avgProgress')}</p>
                                            <p className="text-2xl font-black text-blue-600">{stats.avg_progress}%</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/70 mb-1">{t('reports.pending')}</p>
                                            <p className="text-2xl font-black text-amber-600">{stats.pending_tasks}</p>
                                        </div>
                                    </div>

                                    {/* Team Efficiency Preview (Advanced) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                <Users className="w-3.5 h-3.5" /> {t('reports.advancedMetrics')}
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground italic">{t('reports.basedOn')}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {stats.team_efficacy.slice(0, 6).map((member, i) => (
                                                <div key={i} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 hover:shadow-lg hover:shadow-primary/5 transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-black truncate">{member.full_name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                                    {member.load} {t('reports.active')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className={`text-lg font-black ${member.efficacy > 80 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {member.efficacy}%
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50 dark:border-slate-800">
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t('reports.punctuality')}</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${member.punctuality}%` }} />
                                                                </div>
                                                                <span className="text-[9px] font-black">{member.punctuality}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{t('reports.efficiency')}</p>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(member.efficiency, 100)}%` }} />
                                                                </div>
                                                                <span className="text-[9px] font-black">{member.efficiency}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                        <FileLineChart className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">{t('reports.configurePreview')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileLineChart({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="m16 13-3.5 3.5-2-2L8 17" /></svg>
    )
}
