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
                <div className="relative group">
                    <select
                        value={selectedTask?.id || ''}
                        onChange={(e) => {
                            const task = tasks.find(t => t.id === e.target.value);
                            setSelectedTask(task || null);
                        }}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-[#166A2F]/20 focus:border-[#166A2F] outline-none transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900"
                        disabled={loadingTasks}
                    >
                        <option value="">-- Selecciona una Tarea --</option>
                        {tasks.map(task => (
                            <option key={task.id} value={task.id}>
                                {task.title} {task?.project_title ? `(${task.project_title})` : ''}
                            </option>
                        ))}
                    </select>
                    {loadingTasks ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#166A2F]" />
                        </div>
                    ) : (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-transform group-focus-within:rotate-180">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px]">
                {loadingFollowups ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-[#166A2F]" />
                        <span className="text-xs font-bold animate-pulse">Cargando historial...</span>
                    </div>
                ) : !selectedTask ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-60">
                        <Search className="w-16 h-16 stroke-1" />
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-400">Selecciona una tarea</p>
                            <p className="text-xs">Para ver su historia completa</p>
                        </div>
                    </div>
                ) : followups.length === 0 ? (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center h-full">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <Calendar className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">Sin registros</p>
                        <p className="text-xs text-slate-400 mt-1">Esta tarea no tiene actualizaciones en la bitácora aún.</p>
                    </div>
                ) : (
                    <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 before:-z-0">
                        {followups.map((item) => (
                            <div key={item.id} className="relative pl-8">
                                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-[3px] border-[#166A2F] z-10 shadow-sm" />

                                <div className="flex flex-col gap-3 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {new Date(item.report_date).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {item.user?.full_name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="mb-3">
                                            <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Avance Realizado
                                            </h5>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {item.content_progress}
                                            </p>
                                        </div>

                                        {item.content_issues && (
                                            <div className="pt-3 border-t border-slate-50 dark:border-slate-900">
                                                <h5 className="text-[10px] font-black text-amber-600 dark:text-amber-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Limitantes / Bloqueos
                                                </h5>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {item.content_issues}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
