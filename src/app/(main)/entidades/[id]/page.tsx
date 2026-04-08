'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Mail,
    Phone,
    Globe,
    Edit2,
    Loader2,
    Briefcase,
    CheckSquare,
    DollarSign,
    Package,
    Users,
    UserPlus,
    Trash2,
    AlertCircle,
    ChevronRight,
    MapPin,
    Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@/lib/supabase/client';
import { ActivityTimeline } from '@/shared/components/ActivityTimeline';
import { EntityModal } from '@/features/entities/components/EntityModal';
import { useToast } from '@/shared/components/Toast';
import type { Entity, EntityFormData } from '@/features/entities/types';
import type { Project } from '@/features/projects/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PageProps {
    params: Promise<{ id: string }>;
}

interface ProfileEntity {
    profile_id: string;
    entity_id: string;
    assigned_at: string;
    profile: {
        id: string;
        full_name: string | null;
        email: string | null;
        role?: { name: string } | null;
    };
}

interface ProfileShort {
    id: string;
    full_name: string | null;
    email: string | null;
}

interface EntityStats {
    projectCount: number;
    taskCount: number;
    totalBudget: number;
    activeAssets: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
    Prospecto: 'from-amber-400 to-orange-500',
    Cliente:   'from-emerald-400 to-teal-500',
    Partner:   'from-blue-400 to-indigo-500',
};

const TYPE_BADGES: Record<string, string> = {
    Prospecto: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    Cliente:   'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    Partner:   'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const STATUS_STYLES: Record<string, string> = {
    'Activo':        'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    'Pausado':       'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    'Completado':    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    'Bajo Revisión': 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
};

const PRIORITY_STYLES: Record<string, string> = {
    'Baja':    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    'Media':   'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    'Alta':    'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    'Crítica': 'bg-red-500/10 text-red-700 dark:text-red-400',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    icon,
    label,
    value,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    accent: string;
}) {
    return (
        <div className="card-premium p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
                <p className="text-2xl font-black text-foreground tracking-tight truncate">{value}</p>
            </div>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-pulse">
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="card-premium p-8 h-48 bg-slate-100 dark:bg-slate-800/50" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EntityDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();

    const [entity, setEntity] = useState<Entity | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [profileEntities, setProfileEntities] = useState<ProfileEntity[]>([]);
    const [allProfiles, setAllProfiles] = useState<ProfileShort[]>([]);
    const [stats, setStats] = useState<EntityStats>({ projectCount: 0, taskCount: 0, totalBudget: 0, activeAssets: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // UI state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [addingUserId, setAddingUserId] = useState('');
    const [removingId, setRemovingId] = useState<string | null>(null);

    const supabase = createClient();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            // Entity
            const { data: ent, error: entErr } = await supabase
                .from('entities')
                .select('*')
                .eq('id', id)
                .maybeSingle();

            if (entErr || !ent) { setError(true); return; }
            setEntity(ent);

            // Projects for this entity
            const { data: projs } = await supabase
                .from('projects')
                .select('id, name, status, priority, budget, start_date, entity_id')
                .eq('entity_id', id)
                .order('created_at', { ascending: false });

            const safeProjs: Project[] = (projs || []) as unknown as Project[];
            setProjects(safeProjs);

            // Tasks via projects
            const projectIds = safeProjs.map(p => p.id);
            let taskCount = 0;
            if (projectIds.length > 0) {
                const { count } = await supabase
                    .from('tasks')
                    .select('id', { count: 'exact', head: true })
                    .in('project_id', projectIds);
                taskCount = count ?? 0;
            }

            // Budget
            const totalBudget = safeProjs.reduce((acc, p) => acc + (p.budget ?? 0), 0);

            // Active assets
            const { count: assetCount } = await supabase
                .from('assets')
                .select('id', { count: 'exact', head: true })
                .eq('entity_id', id)
                .neq('status', 'Baja');

            setStats({
                projectCount: safeProjs.length,
                taskCount,
                totalBudget,
                activeAssets: assetCount ?? 0,
            });

            // Profile-entities (users with access)
            const { data: pe } = await supabase
                .from('profile_entities')
                .select('profile_id, entity_id, assigned_at, profile:profiles(id, full_name, email, role:roles(name))')
                .eq('entity_id', id);

            setProfileEntities((pe || []) as unknown as ProfileEntity[]);

            // All profiles for "add user" dropdown
            const { data: allP } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('is_active', true)
                .order('full_name', { ascending: true });

            setAllProfiles((allP || []) as ProfileShort[]);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSaveEntity = async (data: EntityFormData) => {
        const { data: updated, error: err } = await supabase
            .from('entities')
            .update({
                name: data.name,
                type: data.type,
                contact_info: { email: data.email, phone: data.phone },
                website: data.website || null,
                address: data.address || null,
                contact_name: data.contact_name || null,
                contact_email: data.contact_email || null,
                logo_url: data.logo_url || null,
                is_change_management_enabled: data.is_change_management_enabled,
            })
            .eq('id', id)
            .select()
            .single();

        if (err) { toast('Error al guardar los cambios.', 'error'); return; }
        setEntity(updated as Entity);
        toast('Entidad actualizada correctamente.', 'success');
    };

    const handleAddUser = async () => {
        if (!addingUserId) return;
        const { error: err } = await supabase
            .from('profile_entities')
            .insert({ profile_id: addingUserId, entity_id: id, assigned_at: new Date().toISOString() });

        if (err) { toast('Error al agregar el usuario.', 'error'); return; }
        toast('Usuario agregado.', 'success');
        setAddingUserId('');
        setShowAddUser(false);
        fetchData();
    };

    const handleRemoveUser = async (profileId: string) => {
        setRemovingId(profileId);
        const { error: err } = await supabase
            .from('profile_entities')
            .delete()
            .eq('profile_id', profileId)
            .eq('entity_id', id);

        if (err) { toast('Error al remover el usuario.', 'error'); }
        else { toast('Usuario removido.', 'success'); fetchData(); }
        setRemovingId(null);
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const assignedProfileIds = new Set(profileEntities.map(pe => pe.profile_id));
    const unassignedProfiles = allProfiles.filter(p => !assignedProfileIds.has(p.id));

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading) return <PageSkeleton />;

    if (error || !entity) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-muted-foreground font-bold">No se pudo cargar la entidad.</p>
                <button onClick={() => router.back()} className="btn-primary">Volver</button>
            </div>
        );
    }

    const typeGradient = TYPE_COLORS[entity.type] ?? 'from-slate-400 to-slate-600';
    const typeBadge = TYPE_BADGES[entity.type] ?? '';

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-reveal">

            {/* Back button */}
            <div>
                <Link
                    href="/entidades"
                    className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver a Entidades
                </Link>
            </div>

            {/* ── Entity Header Card ─────────────────────────────────────── */}
            <div className="card-premium overflow-hidden">
                {/* Accent bar */}
                <div className={`h-2 bg-gradient-to-r ${typeGradient}`} />

                <div className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        {/* Logo */}
                        <div className={`relative w-20 h-20 flex-shrink-0 rounded-3xl bg-gradient-to-br ${typeGradient} flex items-center justify-center text-white font-black text-2xl shadow-xl ring-4 ring-white dark:ring-slate-900 overflow-hidden`}>
                            {entity.logo_url ? (
                                <img src={entity.logo_url} alt={entity.name} className="w-full h-full object-contain p-2" />
                            ) : (
                                entity.name.substring(0, 2).toUpperCase()
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black text-foreground tracking-tight">{entity.name}</h1>
                                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${typeBadge}`}>
                                    {entity.type}
                                </span>
                            </div>

                            {entity.address && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold mb-3">
                                    <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <span>{entity.address}</span>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 mt-2">
                                {entity.contact_info?.email && (
                                    <a href={`mailto:${entity.contact_info.email}`} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                                        <Mail className="w-3.5 h-3.5" />
                                        {entity.contact_info.email}
                                    </a>
                                )}
                                {entity.contact_info?.phone && (
                                    <a href={`tel:${entity.contact_info.phone}`} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                                        <Phone className="w-3.5 h-3.5" />
                                        {entity.contact_info.phone}
                                    </a>
                                )}
                                {entity.website && (
                                    <a href={entity.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-primary hover:text-indigo-600 transition-colors">
                                        <Globe className="w-3.5 h-3.5" />
                                        {entity.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Edit button */}
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex-shrink-0"
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                    label="Proyectos"
                    value={stats.projectCount}
                    accent="bg-blue-500/10"
                />
                <StatCard
                    icon={<CheckSquare className="w-5 h-5 text-emerald-600" />}
                    label="Tareas"
                    value={stats.taskCount}
                    accent="bg-emerald-500/10"
                />
                <StatCard
                    icon={<DollarSign className="w-5 h-5 text-violet-600" />}
                    label="Presupuesto Total"
                    value={`$${stats.totalBudget.toLocaleString('es-CO')}`}
                    accent="bg-violet-500/10"
                />
                <StatCard
                    icon={<Package className="w-5 h-5 text-amber-600" />}
                    label="Activos Activos"
                    value={stats.activeAssets}
                    accent="bg-amber-500/10"
                />
            </div>

            {/* ── Projects Section ──────────────────────────────────────── */}
            <section aria-labelledby="projects-heading" className="card-premium overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h2 id="projects-heading" className="font-black text-sm uppercase tracking-widest text-foreground">
                        Proyectos
                    </h2>
                    <span className="ml-auto text-[10px] font-black text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {projects.length}
                    </span>
                </div>

                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Briefcase className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-muted-foreground font-semibold">Sin proyectos asignados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 text-left">
                                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridad</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Presupuesto</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inicio</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {projects.map(project => (
                                    <tr key={project.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-foreground text-sm">{project.name}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${STATUS_STYLES[project.status] ?? ''}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${PRIORITY_STYLES[project.priority] ?? ''}`}>
                                                {project.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 font-bold text-muted-foreground">
                                            {project.budget ? `$${project.budget.toLocaleString('es-CO')}` : '—'}
                                        </td>
                                        <td className="px-4 py-4 text-xs text-muted-foreground font-semibold">
                                            {project.start_date
                                                ? format(new Date(project.start_date), 'd MMM yyyy', { locale: es })
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <Link
                                                href={`/proyectos/${project.id}`}
                                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                            >
                                                Ver <ChevronRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ── Users with Access ─────────────────────────────────────── */}
            <section aria-labelledby="users-heading" className="card-premium overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 id="users-heading" className="font-black text-sm uppercase tracking-widest text-foreground">
                        Usuarios con Acceso
                    </h2>
                    <span className="ml-auto text-[10px] font-black text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {profileEntities.length}
                    </span>
                    <button
                        onClick={() => setShowAddUser(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-wider hover:bg-primary/20 transition-colors"
                        aria-expanded={showAddUser}
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Agregar Usuario
                    </button>
                </div>

                {/* Add user panel */}
                {showAddUser && (
                    <div className="px-6 py-4 bg-primary/5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <select
                            value={addingUserId}
                            onChange={e => setAddingUserId(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                            aria-label="Seleccionar usuario"
                        >
                            <option value="">Selecciona un usuario...</option>
                            {unassignedProfiles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.full_name || p.email || p.id}
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddUser}
                                disabled={!addingUserId}
                                className="px-4 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => { setShowAddUser(false); setAddingUserId(''); }}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-xs uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {profileEntities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm text-muted-foreground font-semibold">Sin usuarios asignados</p>
                    </div>
                ) : (
                    <ul role="list" className="divide-y divide-slate-100 dark:divide-slate-800">
                        {profileEntities.map(pe => {
                            const profile = pe.profile;
                            const initials = profile?.full_name
                                ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                                : '?';

                            return (
                                <li key={pe.profile_id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-black text-primary">{initials}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-sm text-foreground truncate">
                                            {profile?.full_name || 'Usuario sin nombre'}
                                        </p>
                                        <p className="text-[10px] font-semibold text-muted-foreground truncate">
                                            {profile?.email}
                                        </p>
                                    </div>
                                    {profile?.role?.name && (
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex-shrink-0">
                                            {profile.role.name}
                                        </span>
                                    )}
                                    {pe.assigned_at && (
                                        <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/60 font-semibold flex-shrink-0">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(pe.assigned_at), 'd MMM yy', { locale: es })}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => handleRemoveUser(pe.profile_id)}
                                        disabled={removingId === pe.profile_id}
                                        aria-label={`Remover acceso a ${profile?.full_name}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-red-500 hover:bg-red-500/10 font-black text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50 flex-shrink-0"
                                    >
                                        {removingId === pe.profile_id
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <Trash2 className="w-3.5 h-3.5" />}
                                        Remover
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* ── Activity Timeline ─────────────────────────────────────── */}
            <section aria-labelledby="timeline-heading">
                <h2 id="timeline-heading" className="font-black text-sm uppercase tracking-widest text-foreground mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    Historial de Actividad
                </h2>
                <ActivityTimeline entityType="entity" entityId={id} maxItems={25} />
            </section>

            {/* ── Edit Modal ────────────────────────────────────────────── */}
            <EntityModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSave={handleSaveEntity}
                entity={entity}
            />
        </div>
    );
}
