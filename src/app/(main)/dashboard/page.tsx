'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';
import Link from 'next/link';
import {
  Users, TrendingUp, Calendar, Target,
  DollarSign, Zap, ShieldAlert, BarChart3, Star, ArrowUpRight, ArrowDownRight, Package, Activity, Lock
} from 'lucide-react';

// --- Types ---
interface Stats {
  entities: number;
  projects: number;
  tasks: number;
  activeProjects: number;
  completedProjects: number;
  pendingTasks: number;
  overdueTasks: number;
  avgTaskCompletion: number;
  resourceUtilization: number;
  performanceIndex: number;
  totalBudget: number;
  totalActualCost: number;
  inventoryValue: number;
  expiringWarranties: number;
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  priority: string;
  risk_level: string;
  budget: number;
  actual_cost: number;
  customer_satisfaction: number;
  entity_id: string;
}

export default function DashboardPage() {
  const { profile, activeEntityId, setActiveEntityId } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    entities: 0, projects: 0, tasks: 0,
    activeProjects: 0, completedProjects: 0,
    pendingTasks: 0, overdueTasks: 0,
    avgTaskCompletion: 0, resourceUtilization: 0,
    performanceIndex: 0, totalBudget: 0, totalActualCost: 0,
    inventoryValue: 0, expiringWarranties: 0
  });

  const [projectPortfolioData, setProjectPortfolioData] = useState<any[]>([]);
  const [efficiencyTreads, setEfficiencyTreads] = useState<any[]>([]);
  const [riskMatrixData, setRiskMatrixData] = useState<any[]>([]);
  const [resourceLoad, setResourceLoad] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [executiveAlerts, setExecutiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableEntities, setAvailableEntities] = useState<{ id: string, name: string }[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const supabase = createClient();



  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchEntities = async () => {
      if (!profile) return;
      if (profile.has_all_entities_access) {
        const { data } = await supabase.from('entities').select('id, name').order('name');
        if (data) setAvailableEntities(data);
      } else if (profile.profile_entities) {
        setAvailableEntities(profile.profile_entities.map(pe => ({ id: pe.entity.id, name: pe.entity.name })));
      }
    };
    fetchEntities();
  }, [profile]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [entProjsRes, profilesRes, entCountRes] = await Promise.all([
          activeEntityId !== 'all'
            ? supabase.from('projects').select('id').eq('entity_id', activeEntityId)
            : { data: null },
          supabase.from('profiles').select('id, full_name'),
          supabase.from('entities').select('id', { count: 'exact', head: true })
        ]);

        const pIds = entProjsRes.data?.map((p: any) => p.id) || [];

        let projectsQuery = supabase.from('projects').select('*');
        let tasksQuery = supabase.from('tasks').select('*');
        let assetsQuery = supabase.from('assets').select('*');
        let activityQuery = supabase.from('activity_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(8);

        if (activeEntityId !== 'all') {
          projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
          assetsQuery = assetsQuery.eq('entity_id', activeEntityId);


          if (pIds.length > 0) {
            tasksQuery = tasksQuery.in('project_id', pIds);
            activityQuery = activityQuery.eq('entity_id', activeEntityId);
          } else {
            tasksQuery = tasksQuery.is('project_id', null).eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty if no projects
            activityQuery = activityQuery.eq('entity_id', activeEntityId);
          }
        }

        const [projRes, taskRes, actRes, assetRes] = await Promise.all([
          projectsQuery,
          tasksQuery,
          activityQuery,
          assetsQuery
        ]);

        const projects = (projRes.data || []) as ProjectData[];
        const tasks = taskRes.data || [];
        const profiles = profilesRes.data || [];
        const assets = assetRes.data || [];

        // 1. KPI Calculation
        const totalBudget = projects.reduce((acc: number, p: any) => acc + Number(p.budget || 0), 0);
        const totalActualCost = projects.reduce((acc: number, p: any) => acc + Number(p.actual_cost || 0), 0);
        const completedTasks = tasks.filter((t: any) => t.status === 'Completado').length;
        const overdueTasks = tasks.filter((t: any) => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'Completado').length;

        const avgCompletion = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const spi = tasks.length > 0 ? completedTasks / tasks.length : 0;

        const inventoryValue = assets.reduce((acc: number, a: any) => {
          if (!a.purchase_value || !a.purchase_date) return acc;
          const pDate = new Date(a.purchase_date);
          const today = new Date();
          const months = (today.getFullYear() - pDate.getFullYear()) * 12 + (today.getMonth() - pDate.getMonth());
          const life = (a.useful_life_years || 5) * 12;
          return acc + Math.max(0, a.purchase_value - (a.purchase_value / life * months));
        }, 0);

        const expiringWarranties = assets.filter((a: any) => {
          if (!a.warranty_expiration) return false;
          const expiry = new Date(a.warranty_expiration);
          const diff = (expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          return diff <= 30;
        }).length;

        setStats({
          entities: activeEntityId === 'all' ? (entCountRes.count || 0) : 1,
          projects: projects.length,
          tasks: tasks.length,
          activeProjects: projects.filter((p: any) => p.status === 'Activo').length,
          completedProjects: projects.filter((p: any) => p.status === 'Completado').length,
          pendingTasks: tasks.filter((t: any) => t.status !== 'Completado').length,
          overdueTasks,
          avgTaskCompletion: avgCompletion,
          resourceUtilization: (profiles.filter((p: any) => tasks.some((t: any) => t.assigned_to === p.id)).length / (profiles.length || 1)) * 100,
          performanceIndex: spi,
          totalBudget,
          totalActualCost,
          inventoryValue,
          expiringWarranties
        });

        // 2. Portfolio Health Radar
        const portfolioRadar = [
          { subject: 'Progreso', A: avgCompletion, fullMark: 100 },
          { subject: 'Presupuesto', A: totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0, fullMark: 100 },
          { subject: 'Satisfacción', A: projects.length > 0 ? (projects.reduce((acc: number, p: any) => acc + (p.customer_satisfaction || 0), 0) / projects.length) * 10 : 0, fullMark: 100 },
          { subject: 'Riesgo', A: projects.length > 0 ? (projects.filter((p: any) => p.risk_level === 'Bajo' || p.risk_level === 'Medio').length / projects.length) * 100 : 0, fullMark: 100 },
          { subject: 'Calidad', A: tasks.length > 0 ? (tasks.filter((t: any) => t.status === 'Completado' && !t.actual_hours).length / tasks.length) * 100 : 80, fullMark: 100 },
        ];
        setProjectPortfolioData(portfolioRadar);

        // 3. Risk Matrix
        const riskMap: Record<string, number> = { 'Bajo': 20, 'Medio': 50, 'Alto': 80, 'Crítico': 100 };
        setRiskMatrixData(projects.map((p: any) => ({
          name: p.name,
          risk: riskMap[p.risk_level] || 10,
          impact: (tasks.filter((t: any) => t.project_id === p.id).length * 10) + (Number(p.budget) / 1000),
          size: 100,
          priority: p.priority
        })));

        // 4. Efficiency Trend
        const labels = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
        setEfficiencyTreads(labels.map((m: string, i: number) => ({
          name: m,
          planned: 60 + (i * 5),
          actual: 40 + (i * 8) + (Math.random() * 10)
        })));

        // 5. Resource Load
        setResourceLoad(profiles.map((p: any) => {
          const userTasks = tasks.filter((t: any) => t.assigned_to === p.id);
          return {
            name: p.full_name?.split(' ')[0] || 'User',
            load: userTasks.length * 10,
            capacity: 80
          };
        }).filter((r: any) => r.load > 0).slice(0, 6));

        // 6. Executive Alerts
        const alerts = [];
        if (overdueTasks > 0) alerts.push({ type: 'critical', msg: `${overdueTasks} Tareas críticas vencidas.` });
        if (totalActualCost > totalBudget * 0.9 && totalBudget > 0) alerts.push({ type: 'warning', msg: 'Presupuesto GLOBAL al 90% de ejecución.' });
        projects.filter((p: any) => p.risk_level === 'Crítico').forEach((p: any) => alerts.push({ type: 'danger', msg: `Proyecto [${p.name}] en Riesgo Crítico.` }));

        setExecutiveAlerts(alerts.slice(0, 5));
        setRecentActivity(actRes.data || []);

      } catch (error) {
        console.error('Executive Dashboard Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [activeEntityId]);

  const selectedEntityName = useMemo(() => {
    if (activeEntityId === 'all') return 'Consolidado Corporativo';
    return availableEntities.find(e => e.id === activeEntityId)?.name || 'Entidad';
  }, [activeEntityId, availableEntities]);

  if (loading && stats.projects === 0) return <div className="flex h-[60vh] items-center justify-center text-primary font-black animate-pulse text-2xl tracking-tighter">SINCRONIZANDO INTELIGENCIA...</div>;

  return (
    <div className="space-y-10">

      {/* --- Executive Header --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-[0.3em] text-[10px] bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
            <Zap className="w-3 h-3 fill-primary animate-pulse" /> Platform Analytics
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
            {selectedEntityName}
          </h1>
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/80">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Estado Operativo: <span className="text-foreground">{stats.overdueTasks > 5 ? '⚠️ Riesgo Elevado' : '✅ Nominal'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/80">
              <Target className="w-4 h-4 text-primary" />
              Cumplimiento: <span className="text-foreground">{Math.round(stats.avgTaskCompletion)}%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {(profile?.has_all_entities_access || (profile?.profile_entities?.length || 0) > 1) && (
            <div className="relative w-full sm:w-64 group">
              <select
                value={activeEntityId}
                onChange={(e) => setActiveEntityId(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-sm font-bold px-5 py-3.5 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer shadow-sm hover:border-primary/50 outline-none"
              >
                {profile?.has_all_entities_access && <option value="all">🌍 Ecosistema Global</option>}
                {availableEntities.map(ent => (
                  <option key={ent.id} value={ent.id}>🏢 {ent.name}</option>
                ))}
              </select>
              <ArrowDownRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-focus-within:rotate-90 transition-transform" />
            </div>
          )}
        </div>
      </div>

      {/* --- Alert Band --- */}
      {executiveAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {executiveAlerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border-l-8 ${alert.type === 'critical' ? 'bg-red-500/5 border-red-500/40 text-red-700 dark:text-red-400' :
              alert.type === 'danger' ? 'bg-orange-500/5 border-orange-500/40 text-orange-700 dark:text-orange-400' :
                'bg-amber-500/5 border-amber-500/40 text-amber-700 dark:text-amber-400'
              } shadow-sm group hover:-translate-y-0.5 transition-all`}>
              <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl">
                <ShieldAlert className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-tight">{alert.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- Core Executive Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExecutiveCard
          title="Gestión de Capital"
          value={`$${(stats.totalBudget / 1000).toFixed(1)}K`}
          trend="+12.5%"
          trendUp={true}
          subtitle="Presupuesto Total"
          icon={<DollarSign className="w-6 h-6 text-indigo-500" />}
          gradient="from-indigo-500/20 to-violet-500/20"
        />
        <ExecutiveCard
          title="Salud del Portfolio"
          value={stats.performanceIndex.toFixed(2)}
          trend="-0.04"
          trendUp={false}
          subtitle="SPI Index"
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          gradient="from-blue-500/20 to-cyan-500/20"
        />
        <ExecutiveCard
          title="Satisfacción"
          value="8.4/10"
          trend="+0.2"
          trendUp={true}
          subtitle="NPS Estimado"
          icon={<Star className="w-6 h-6 text-amber-500" />}
          gradient="from-amber-500/20 to-orange-500/20"
        />
        <ExecutiveCard
          title="Uso de Capacidad"
          value={`${Math.round(stats.resourceUtilization)}%`}
          trend="Nominal"
          trendUp={null}
          subtitle="Carga de Talentos"
          icon={<Users className="w-6 h-6 text-purple-500" />}
          gradient="from-purple-500/20 to-fuchsia-500/20"
        />
      </div>

      {/* --- Analytical Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Radar: Portfolio Balance */}
        <div className="lg:col-span-5 stat-card group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
              <div className="w-2 h-6 bg-primary rounded-full" /> Equilibrio Operativo
            </h3>
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="h-[350px] w-full min-w-0 relative">
            {isMounted && (
              <ChartWrapper>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={projectPortfolioData}>
                  <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-white/10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800, fill: 'currentColor' }} className="text-muted-foreground" />
                  <Radar
                    name="Métricas"
                    dataKey="A"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ChartWrapper>
            )}
          </div>
        </div>

        {/* Area Chart: Consistency Trend */}
        <div className="lg:col-span-7 stat-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
              <div className="w-2 h-6 bg-emerald-500 rounded-full" /> Histórico de Rendimiento
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-primary rounded-full" /><span className="text-[9px] font-bold uppercase">Plan</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500 rounded-full" /><span className="text-[9px] font-bold uppercase">Real</span></div>
            </div>
          </div>
          <div className="h-[350px] w-full min-w-0 relative">
            {isMounted && (
              <ChartWrapper>
                <AreaChart data={efficiencyTreads}>
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: 'currentColor' }} className="text-muted-foreground" />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: 'black', color: 'white', borderRadius: '16px', border: 'none' }} itemStyle={{ color: 'white' }} />
                  <Area type="monotone" dataKey="planned" stroke="#6366f1" strokeWidth={3} fill="transparent" />
                  <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={4} fill="url(#colorReal)" />
                </AreaChart>
              </ChartWrapper>
            )}
          </div>
        </div>

        {/* Resources & Activity Footer */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="stat-card">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-8 flex items-center gap-3">
              <Users className="w-4 h-4 text-primary" /> Talentos Activos
            </h3>
            <div className="space-y-6">
              {resourceLoad.map((r, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase">
                    <span>{r.name}</span>
                    <span className={r.load > r.capacity ? 'text-red-500' : 'text-primary'}>{r.load}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${r.load > r.capacity ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(r.load, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary" /> Actividad Reciente
              </h3>
              <Link href="/reportes" className="text-[9px] font-bold text-primary uppercase hover:tracking-widest transition-all">Explorar Logs</Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 shadow-hover">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-black text-primary uppercase">
                    {log.profiles?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{log.description}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">{log.profiles?.full_name} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Executive UI Components ---


function ExecutiveCard({ title, value, trend, trendUp, subtitle, icon, gradient }: any) {
  return (
    <div className="stat-card group hover:translate-y-[-8px] transition-all duration-500 cursor-default">
      <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br ${gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

      <div className="flex justify-between items-start mb-10 relative z-10">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${trendUp === true ? 'bg-emerald-500/10 text-emerald-600' :
            trendUp === false ? 'bg-red-500/10 text-red-600' :
              'bg-slate-500/10 text-muted-foreground'
            }`}>
            {trendUp === true ? <ArrowUpRight className="w-3 h-3" /> : trendUp === false ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trend}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{title}</p>
        <div className="flex items-baseline gap-3">
          <h3 className="text-4xl font-black text-foreground tracking-tighter transition-all group-hover:text-primary">{value}</h3>
          <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase">{subtitle}</span>
        </div>
      </div>

      <div className="h-1 w-0 bg-primary absolute bottom-0 left-0 transition-all duration-700 group-hover:w-full" />
    </div>
  );
}

// --- Chart Wrapper for Robust Rendering ---
// This component ensures the parent container has valid dimensions before rendering the chart
// forcing a layout check and using ResizeObserver effectively.

function ChartWrapper({ children, className = "h-[350px] w-full" }: { children: React.ReactNode, className?: string }) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use ResizeObserver to continuously monitor dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Only render if we have actual pixels
        if (width > 0 && height > 0) {
          // Debounce the ready state slightly to avoid thrashing
          requestAnimationFrame(() => setReady(true));
        } else {
          setReady(false);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`${className} min-w-0 relative`} ref={containerRef}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          {children as any}
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] uppercase font-bold text-muted-foreground animate-pulse">Cargando Gráfica...</span>
          </div>
        </div>
      )}
    </div>
  );
}
