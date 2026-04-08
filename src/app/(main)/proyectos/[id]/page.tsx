'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Pencil,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    Layers,
    DollarSign,
    Calendar,
    CalendarCheck,
    ChevronRight,
    Briefcase,
    RefreshCw,
    ShieldCheck,
    Headphones,
    User,
    ListChecks,
    FolderGit2,
    ReceiptText,
    Flag,
    Star,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { ActivityTimeline } from '@/shared/components/ActivityTimeline';
import { MilestonesSection } from '@/features/projects/components/MilestonesSection';
import { ScheduleMeeting } from '@/shared/components/ScheduleMeeting';
import { GanttChart, type GanttMilestone } from '@/features/projects/components/GanttChart';
import { ProjectModal } from '@/features/projects/components/ProjectModal';
import { SubProjectsSection } from '@/features/projects/components/SubProjectsSection';
import { ProjectNotes } from '@/features/projects/components/ProjectNotes';
import { ProjectHealthCard } from '@/features/projects/components/ProjectHealthCard';
import type { Project, SubProject, RecurrentExpense, ProjectFormData } from '@/features/projects/types';
import type { Task } from '@/features/tasks/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
    params: Promise<{ id: string }>;
}

interface ProjectWithRelations extends Project {
    sub_projects: SubProject[];
    expenses: RecurrentExpense[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
    'Activo':        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    'Pausado':       'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
    'Completado':    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
    'Bajo Revisión': 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20',
};

const PRIORITY_STYLES: Record<string, string> = {
    'Baja':    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    'Media':   'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
    'Alta':    'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20',
    'Crítica': 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
};

const TASK_STATUS_STYLES: Record<string, string> = {
    'Pendiente':   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'En Progreso': 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    'Revisión':    'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    'Completado':  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
};

const TASK_PRIORITY_STYLES: Record<string, string> = {
    'Baja':  'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    'Media': 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    'Alta':  'bg-red-500/10 text-red-700 dark:text-red-400',
};

const SUB_STATUS_STYLES: Record<string, string> = {
    'En Tiempo':  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    'En Riesgo':  'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    'Demorado':   'bg-red-500/10 text-red-700 dark:text-red-400',
    'Bloqueado':  'bg-slate-500/10 text-slate-700 dark:text-slate-400',
};

const FREQUENCY_LABELS: Record<string, string> = {
    mensual: 'Mensual',
    anual:   'Anual',
    unico:   'Único',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
        return format(parseISO(dateStr), 'd MMM yyyy', { locale: es });
    } catch {
        return dateStr;
    }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, className }: { label: string; className: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
            {label}
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    sub?: string;
    accent?: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4 items-start">
            <div className={`mt-0.5 p-2.5 rounded-lg ${accent ?? 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className="text-xl font-bold text-foreground leading-tight truncate">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            </div>
        </div>
    );
}

function SectionHeader({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count?: number }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <Icon className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h2>
            {count !== undefined && (
                <span className="ml-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
                    {count}
                </span>
            )}
        </div>
    );
}

function SkeletonPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                ))}
            </div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
    );
}

function ErrorPage({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-base font-semibold text-foreground">No se pudo cargar el proyecto</p>
            <p className="text-sm text-muted-foreground">Verifica tu conexion e intenta nuevamente.</p>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                <RefreshCw className="w-4 h-4" />
                Reintentar
            </button>
        </div>
    );
}

// ─── Tasks Table ──────────────────────────────────────────────────────────────

function TasksSection({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <ListChecks className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Sin tareas asociadas a este proyecto.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titulo</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Sub-estado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Prioridad</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Asignado</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {tasks.map((task) => (
                            <tr
                                key={task.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <span className="font-medium text-foreground line-clamp-1">{task.title}</span>
                                    {/* Mobile: show status inline */}
                                    <div className="flex flex-wrap gap-1.5 mt-1 sm:hidden">
                                        <Badge
                                            label={task.status}
                                            className={TASK_STATUS_STYLES[task.status] ?? 'bg-slate-100 text-slate-600'}
                                        />
                                        <Badge
                                            label={task.priority}
                                            className={TASK_PRIORITY_STYLES[task.priority] ?? 'bg-slate-100 text-slate-600'}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <Badge
                                        label={task.status}
                                        className={TASK_STATUS_STYLES[task.status] ?? 'bg-slate-100 text-slate-600'}
                                    />
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <Badge
                                        label={task.sub_status}
                                        className={SUB_STATUS_STYLES[task.sub_status] ?? 'bg-slate-100 text-slate-600'}
                                    />
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <Badge
                                        label={task.priority}
                                        className={TASK_PRIORITY_STYLES[task.priority] ?? 'bg-slate-100 text-slate-600'}
                                    />
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    {task.assignee ? (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                                <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <span className="text-xs text-foreground truncate max-w-[120px]">{task.assignee.full_name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sin asignar</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    <span className="text-xs text-muted-foreground">{formatDate(task.end_date)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// ─── Expenses Section ─────────────────────────────────────────────────────────

function ExpensesSection({ expenses }: { expenses: RecurrentExpense[] }) {
    if (expenses.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                <ReceiptText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Sin gastos recurrentes registrados.</p>
            </div>
        );
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descripcion</th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Frecuencia</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-medium text-foreground">{expense.description}</span>
                                    <span className="sm:hidden ml-2 text-xs text-muted-foreground">
                                        ({FREQUENCY_LABELS[expense.frequency] ?? expense.frequency})
                                    </span>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                    <Badge
                                        label={FREQUENCY_LABELS[expense.frequency] ?? expense.frequency}
                                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className="font-semibold text-foreground">{formatCurrency(expense.amount)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                            <td className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wide" colSpan={2}>Total</td>
                            <td className="px-4 py-3 text-right font-bold text-foreground">{formatCurrency(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [project, setProject] = useState<ProjectWithRelations | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [milestones, setMilestones] = useState<GanttMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [satisfactionValue, setSatisfactionValue] = useState<number>(0);
    const [savingSatisfaction, setSavingSatisfaction] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);

        try {
            const supabase = createClient();

            const [projectResult, tasksResult, milestonesResult] = await Promise.all([
                supabase
                    .from('projects')
                    .select(`
                        *,
                        entity:entity_id(id, name),
                        sub_projects(*),
                        expenses:project_recurrent_expenses(*)
                    `)
                    .eq('id', id)
                    .single(),
                supabase
                    .from('tasks')
                    .select(`
                        *,
                        assignee:assigned_to(id, full_name, avatar_url)
                    `)
                    .eq('project_id', id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('project_milestones')
                    .select('id, title, due_date, is_completed')
                    .eq('project_id', id)
                    .order('sort_order', { ascending: true }),
            ]);

            if (projectResult.error) throw projectResult.error;

            const proj = projectResult.data as ProjectWithRelations;
            setProject(proj);
            setSatisfactionValue(proj.customer_satisfaction ?? 0);
            setTasks((tasksResult.data ?? []) as Task[]);
            setMilestones((milestonesResult.data ?? []) as GanttMilestone[]);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async (data: ProjectFormData) => {
        const supabase = createClient();
        await supabase.from('projects').update(data).eq('id', id);
        await fetchData();
        setShowEditModal(false);
    };

    const handleSatisfactionChange = async (value: number) => {
        setSatisfactionValue(value);
        setSavingSatisfaction(true);
        try {
            const supabase = createClient();
            await supabase
                .from('projects')
                .update({ customer_satisfaction: value })
                .eq('id', id);
            setProject((prev) => prev ? { ...prev, customer_satisfaction: value } : prev);
        } finally {
            setSavingSatisfaction(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading) return <SkeletonPage />;
    if (error || !project) return <ErrorPage onRetry={fetchData} />;

    // ── Derived stats ──
    const completedTasks = tasks.filter((t) => t.status === 'Completado').length;
    const totalTasks = tasks.length;
    const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedSubProjects = project.sub_projects.filter((sp) => sp.status === 'Completado').length;
    const totalSubProjects = project.sub_projects.length;
    const subProjectPct = totalSubProjects > 0 ? Math.round((completedSubProjects / totalSubProjects) * 100) : 0;

    // ── Expense-based actual cost ──
    const expenseActualCost = (project.expenses ?? []).reduce((sum, e) => {
        if (e.frequency === 'mensual') return sum + e.amount * 12;
        return sum + e.amount;
    }, 0);

    // ── Milestone stats (from the already-fetched milestones array) ──
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.is_completed).length;

    const durationDays =
        project.start_date && project.end_date
            ? differenceInDays(parseISO(project.end_date), parseISO(project.start_date))
            : null;

    const budgetUsedPct =
        project.has_budget && project.budget && project.budget > 0
            ? Math.min(Math.round((project.actual_cost / project.budget) * 100), 100)
            : null;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left: breadcrumb + title */}
                <div className="space-y-1">
                    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
                        <button
                            onClick={() => router.push('/proyectos')}
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
                            aria-label="Volver a proyectos"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Proyectos
                        </button>
                        <ChevronRight className="w-3 h-3 opacity-50" />
                        <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-xs">{project.name}</span>
                    </nav>

                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{project.name}</h1>

                    {project.entity && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            {project.entity.name}
                        </p>
                    )}

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge
                            label={project.status}
                            className={STATUS_STYLES[project.status] ?? 'bg-slate-100 text-slate-600'}
                        />
                        <Badge
                            label={`Prioridad ${project.priority}`}
                            className={PRIORITY_STYLES[project.priority] ?? 'bg-slate-100 text-slate-600'}
                        />
                        {project.contract_active && (
                            <Badge label="Contrato activo" className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20" />
                        )}
                        {project.has_support && (
                            <Badge label="Con soporte" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20" />
                        )}
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => router.push('/proyectos')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Volver"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver</span>
                    </button>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        aria-label="Editar proyecto"
                    >
                        <Pencil className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar Proyecto</span>
                    </button>
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={ListChecks}
                    label="Tareas"
                    value={`${completedTasks} / ${totalTasks}`}
                    sub={totalTasks > 0 ? `${taskCompletionPct}% completadas` : 'Sin tareas aun'}
                    accent="bg-emerald-500/10"
                />
                <StatCard
                    icon={DollarSign}
                    label="Presupuesto vs Costo"
                    value={project.has_budget && project.budget ? formatCurrency(project.budget) : 'Sin presupuesto'}
                    sub={
                        project.has_budget && project.budget
                            ? `Costo real: ${formatCurrency(project.actual_cost)} (${budgetUsedPct ?? 0}%)`
                            : `Costo actual: ${formatCurrency(project.actual_cost)}`
                    }
                    accent="bg-sky-500/10"
                />
                <StatCard
                    icon={Calendar}
                    label="Duracion"
                    value={durationDays !== null ? `${durationDays} dias` : '—'}
                    sub={`${formatDate(project.start_date)} → ${formatDate(project.end_date)}`}
                    accent="bg-violet-500/10"
                />
                <StatCard
                    icon={Layers}
                    label="Sub-proyectos"
                    value={`${completedSubProjects} / ${totalSubProjects}`}
                    sub={totalSubProjects > 0 ? `${subProjectPct}% completados` : 'Sin sub-proyectos'}
                    accent="bg-amber-500/10"
                />
            </div>

            {/* ── Project Health Card ── */}
            <ProjectHealthCard
                tasks={tasks}
                budget={project.budget ?? 0}
                actualCost={expenseActualCost > 0 ? expenseActualCost : project.actual_cost}
                milestoneCount={totalMilestones}
                completedMilestones={completedMilestones}
            />

            {/* ── Budget progress bar ── */}
            {project.has_budget && project.budget && budgetUsedPct !== null && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            Ejecucion presupuestal
                        </span>
                        <span className={`text-xs font-bold ${budgetUsedPct >= 90 ? 'text-red-600 dark:text-red-400' : budgetUsedPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {budgetUsedPct}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5" role="progressbar" aria-valuenow={budgetUsedPct} aria-valuemin={0} aria-valuemax={100}>
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${budgetUsedPct >= 90 ? 'bg-red-500' : budgetUsedPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${budgetUsedPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                        <span>{formatCurrency(project.actual_cost)} ejecutado</span>
                        <span>{formatCurrency(project.budget)} presupuestado</span>
                    </div>
                </div>
            )}

            {/* ── Task progress bar ── */}
            {totalTasks > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Progreso de tareas
                        </span>
                        <span className="text-xs font-bold text-foreground">{taskCompletionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5" role="progressbar" aria-valuenow={taskCompletionPct} aria-valuemin={0} aria-valuemax={100}>
                        <div
                            className="h-2.5 rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${taskCompletionPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                        <span>{completedTasks} completadas</span>
                        <span>{totalTasks} en total</span>
                    </div>
                </div>
            )}

            {/* ── Metadata chips ── */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Inicio: <strong className="text-foreground">{formatDate(project.start_date)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Fin: <strong className="text-foreground">{formatDate(project.end_date)}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Contrato: <strong className="text-foreground">{project.contract_active ? 'Activo' : 'Inactivo'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Soporte: <strong className="text-foreground">{project.has_support ? 'Si' : 'No'}</strong></span>
                </div>
            </div>

            {/* ── Customer Satisfaction ── */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        Satisfaccion del cliente
                    </span>
                    <span className={`text-sm font-bold transition-colors ${satisfactionValue >= 8 ? 'text-emerald-600 dark:text-emerald-400' : satisfactionValue >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                        {satisfactionValue}/10
                        {savingSatisfaction && <span className="ml-2 text-[10px] text-muted-foreground font-normal">Guardando...</span>}
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={satisfactionValue}
                    onChange={(e) => setSatisfactionValue(Number(e.target.value))}
                    onMouseUp={(e) => handleSatisfactionChange(Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleSatisfactionChange(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-primary"
                    aria-label="Nivel de satisfaccion del cliente (0-10)"
                />
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <span key={n}>{n}</span>
                    ))}
                </div>
            </div>

            {/* ── Tasks Section ── */}
            <section aria-labelledby="tasks-heading">
                <SectionHeader icon={ListChecks} title="Tareas del proyecto" count={totalTasks} />
                <TasksSection tasks={tasks} />
            </section>

            {/* ── Gantt / Timeline Section ── */}
            {totalTasks > 0 && (
                <section aria-labelledby="gantt-heading">
                    <SectionHeader icon={Calendar} title="Timeline / Gantt" count={totalTasks} />
                    <GanttChart
                        tasks={tasks}
                        projectStartDate={project.start_date ?? undefined}
                        projectEndDate={project.end_date ?? undefined}
                        milestones={milestones}
                    />
                </section>
            )}

            {/* ── Milestones Section ── */}
            <section aria-labelledby="milestones-heading">
                <SectionHeader icon={Flag} title="Hitos del proyecto" />
                <MilestonesSection projectId={id} editable={true} />
            </section>

            {/* ── Meeting Scheduler ── */}
            <section aria-labelledby="meetings-heading">
                <ScheduleMeeting
                    entityType="project"
                    entityId={id}
                    entityTitle={project.name}
                />
            </section>

            {/* ── Project Notes ── */}
            <section aria-labelledby="notes-heading">
                <ProjectNotes
                    projectId={id}
                    initialDescription={project.description}
                />
            </section>

            {/* ── Sub-projects Section ── */}
            <section aria-labelledby="subprojects-heading">
                <SectionHeader icon={FolderGit2} title="Sub-proyectos" />
                <SubProjectsSection projectId={id} />
            </section>

            {/* ── Expenses Section ── */}
            <section aria-labelledby="expenses-heading">
                <SectionHeader icon={ReceiptText} title="Gastos recurrentes" count={project.expenses.length} />
                <ExpensesSection expenses={project.expenses} />
            </section>

            {/* ── Activity Timeline ── */}
            <section aria-labelledby="activity-heading">
                <ActivityTimeline entityType="project" entityId={id} />
            </section>

            {/* ── Edit Modal ── */}
            <ProjectModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEdit}
                project={project}
            />

        </div>
    );
}
