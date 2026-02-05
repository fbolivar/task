'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { taskService } from '@/features/tasks/services/taskService';
import { trackingService } from '@/features/tasks/services/trackingService';
import { TaskFollowup } from '@/features/tasks/types';

interface SearchTask {
    id: string;
    title: string;
    project_title?: string;
}

export function FollowupLookupWidget() {
    // const [searchTerm, setSearchTerm] = useState(''); // Removed
    const [tasks, setTasks] = useState<SearchTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<SearchTask | null>(null);
    const [followups, setFollowups] = useState<TaskFollowup[]>([]);

    const [loadingTasks, setLoadingTasks] = useState(false);
    const [loadingFollowups, setLoadingFollowups] = useState(false);

    // Load User's Tasks on Mount
    useEffect(() => {
        const loadUserTasks = async () => {
            setLoadingTasks(true);
            try {
                const myTasks = await taskService.getTasks('all');

                setTasks(myTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    project_title: t.project?.name
                })));
            } catch (error) {
                console.error('Error loading user tasks:', error);
            } finally {
                setLoadingTasks(false);
            }
        };

        loadUserTasks();
    }, []);

    // Fetch Followups when task selected
    useEffect(() => {
        const loadFollowups = async () => {
            if (!selectedTask) {
                setFollowups([]);
                return;
            }

            setLoadingFollowups(true);
            try {
                const data = await trackingService.getFollowups(selectedTask.id);
                setFollowups(data);
            } catch (error) {
                console.error('Error loading followups', error);
            } finally {
                setLoadingFollowups(false);
            }
        };

        loadFollowups();
    }, [selectedTask]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <Search className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-foreground">Explorador de Bitácoras</h3>
                    <p className="text-xs font-bold text-muted-foreground">Selecciona una tarea para ver su seguimiento</p>
                </div>
            </div>

            {/* Task Selector */}
            <div className="relative mb-6 z-20">
                <div className="relative">
                    <select
                        value={selectedTask?.id || ''}
                        onChange={(e) => {
                            const task = tasks.find(t => t.id === e.target.value);
                            setSelectedTask(task || null);
                        }}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
                        disabled={loadingTasks}
                    >
                        <option value="">-- Selecciona una Tarea --</option>
                        {tasks.map(task => (
                            <option key={task.id} value={task.id}>
                                {task.title} {task.project_title ? `(${task.project_title})` : ''}
                            </option>
                        ))}
                    </select>
                    {loadingTasks ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
                {loadingFollowups ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-xs font-bold">Cargando historial...</span>
                    </div>
                ) : !selectedTask ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                        <Search className="w-12 h-12" />
                        <div className="text-center">
                            <p className="text-sm font-bold">Selecciona una tarea</p>
                            <p className="text-xs">Para ver su historia completa</p>
                        </div>
                    </div>
                ) : followups.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-sm font-bold text-muted-foreground">Esta tarea no tiene registros en la bitácora aún.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {followups.map((item) => (
                            <div key={item.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-slate-800 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900" />

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {item.report_date}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {item.user?.full_name?.split(' ')[0]}
                                        </span>
                                    </div>

                                    <div className="bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-900/20">
                                        <h5 className="text-[10px] font-black text-green-700 dark:text-green-500 mb-1 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> AVANCE
                                        </h5>
                                        <p className="text-xs font-medium text-foreground">{item.content_progress}</p>
                                    </div>

                                    {item.content_issues && (
                                        <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20">
                                            <h5 className="text-[10px] font-black text-amber-700 dark:text-amber-500 mb-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" /> LIMITANTES
                                            </h5>
                                            <p className="text-xs font-medium text-foreground">{item.content_issues}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
