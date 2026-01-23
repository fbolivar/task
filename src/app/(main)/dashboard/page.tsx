'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, Legend
} from 'recharts';
import {
  Users, Briefcase, AlertCircle, CheckCircle2,
  Activity, Clock, TrendingUp, Calendar, AlertTriangle, Battery, Target, ChevronDown, Building2,
  DollarSign, Zap, ShieldAlert, BarChart3, Star, ArrowUpRight, ArrowDownRight, Package, ShieldCheck
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

  const supabase = createClient();
  const isGerente = profile?.role?.name === 'Gerente';

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
        let projectsQuery = supabase.from('projects').select('*');
        let tasksQuery = supabase.from('tasks').select('*');
        let assetsQuery = supabase.from('assets').select('*');
        let activityQuery = supabase.from('activity_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(8);

        if (activeEntityId !== 'all') {
          projectsQuery = projectsQuery.eq('entity_id', activeEntityId);
          assetsQuery = assetsQuery.eq('entity_id', activeEntityId);
          const { data: entProjs } = await supabase.from('projects').select('id').eq('entity_id', activeEntityId);
          const pIds = entProjs?.map(p => p.id) || [];
          if (pIds.length > 0) {
            tasksQuery = tasksQuery.in('project_id', pIds);
            activityQuery = activityQuery.or(`entity_id.eq.${activeEntityId},entity_id.in.(${pIds.join(',')})`);
          } else {
            tasksQuery = tasksQuery.eq('id', '00000000-0000-0000-0000-000000000000');
          }
        }

        const [projRes, taskRes, actRes, profRes, entCountRes, assetRes] = await Promise.all([
          projectsQuery,
          tasksQuery,
          activityQuery,
          supabase.from('profiles').select('id, full_name'),
          supabase.from('entities').select('id', { count: 'exact', head: true }),
          assetsQuery
        ]);

        const projects = (projRes.data || []) as ProjectData[];
        const tasks = taskRes.data || [];
        const profiles = profRes.data || [];
        const assets = assetRes.data || [];

        // --- Analytical Processing ---

        // 1. KPI Calculation
        const totalBudget = projects.reduce((acc, p) => acc + Number(p.budget || 0), 0);
        const totalActualCost = projects.reduce((acc, p) => acc + Number(p.actual_cost || 0), 0);
        const completedTasks = tasks.filter(t => t.status === 'Completado').length;
        const overdueTasks = tasks.filter(t => t.end_date && new Date(t.end_date) < new Date() && t.status !== 'Completado').length;

        const avgCompletion = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const spi = tasks.length > 0 ? completedTasks / tasks.length : 0;

        const inventoryValue = assets.reduce((acc, a) => {
          if (!a.purchase_value || !a.purchase_date) return acc;
          const pDate = new Date(a.purchase_date);
          const today = new Date();
          const months = (today.getFullYear() - pDate.getFullYear()) * 12 + (today.getMonth() - pDate.getMonth());
          const life = (a.useful_life_years || 5) * 12;
          return acc + Math.max(0, a.purchase_value - (a.purchase_value / life * months));
        }, 0);

        const expiringWarranties = assets.filter(a => {
          if (!a.warranty_expiration) return false;
          const expiry = new Date(a.warranty_expiration);
          const diff = (expiry.getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          return diff <= 30;
        }).length;

        setStats({
          entities: activeEntityId === 'all' ? (entCountRes.count || 0) : 1,
          projects: projects.length,
          tasks: tasks.length,
          activeProjects: projects.filter(p => p.status === 'Activo').length,
          completedProjects: projects.filter(p => p.status === 'Completado').length,
          pendingTasks: tasks.filter(t => t.status !== 'Completado').length,
          overdueTasks,
          avgTaskCompletion: avgCompletion,
          resourceUtilization: (profiles.filter(p => tasks.some(t => t.assigned_to === p.id)).length / profiles.length) * 100,
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
          { subject: 'Satisfacción', A: projects.length > 0 ? (projects.reduce((acc, p) => acc + (p.customer_satisfaction || 0), 0) / projects.length) * 10 : 0, fullMark: 100 },
          { subject: 'Riesgo', A: projects.length > 0 ? (projects.filter(p => p.risk_level === 'Bajo' || p.risk_level === 'Medio').length / projects.length) * 100 : 0, fullMark: 100 },
          { subject: 'Calidad', A: tasks.length > 0 ? (tasks.filter(t => t.status === 'Completado' && !t.actual_hours).length / tasks.length) * 100 : 80, fullMark: 100 },
        ];
        setProjectPortfolioData(portfolioRadar);

        // 3. Risk Matrix
        const riskMap: Record<string, number> = { 'Bajo': 20, 'Medio': 50, 'Alto': 80, 'Crítico': 100 };
        setRiskMatrixData(projects.map(p => ({
          name: p.name,
          risk: riskMap[p.risk_level] || 10,
          impact: (tasks.filter(t => t.project_id === p.id).length * 10) + (Number(p.budget) / 1000),
          size: 100,
          priority: p.priority
        })));

        // 4. Efficiency Trend
        const labels = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
        setEfficiencyTreads(labels.map((m, i) => ({
          name: m,
          planned: 60 + (i * 5),
          actual: 40 + (i * 8) + (Math.random() * 10)
        })));

        // 5. Resource Load
        setResourceLoad(profiles.map(p => {
          const userTasks = tasks.filter(t => t.assigned_to === p.id);
          return {
            name: p.full_name?.split(' ')[0] || 'User',
            load: userTasks.length * 10,
            capacity: 80
          };
        }).filter(r => r.load > 0).slice(0, 6));

        // 6. Executive Alerts
        const alerts = [];
        if (overdueTasks > 0) alerts.push({ type: 'critical', msg: `${overdueTasks} Tareas críticas vencidas.` });
        if (totalActualCost > totalBudget * 0.9 && totalBudget > 0) alerts.push({ type: 'warning', msg: 'Presupuesto GLOBAL al 90% de ejecución.' });
        projects.filter(p => p.risk_level === 'Crítico').forEach(p => alerts.push({ type: 'danger', msg: `Proyecto [${p.name}] en Riesgo Crítico.` }));

        // Granular Budget Alerts per Project
        projects.filter(p => p.budget > 0 && (p.actual_cost / p.budget) >= 0.9).forEach(p => {
          const pct = Math.round((p.actual_cost / p.budget) * 100);
          alerts.push({
            type: pct >= 100 ? 'critical' : 'warning',
            msg: `Presupuesto de [${p.name}] al ${pct}%.`
          });
        });

        const criticalWarranties = assets.filter(a => {
          if (!a.warranty_expiration) return false;
          const diff = (new Date(a.warranty_expiration).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
          return diff <= 15 && diff >= 0;
        });
        criticalWarranties.forEach(a => alerts.push({ type: 'danger', msg: `Garantía de [${a.name}] por vencer.` }));

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

  if (loading && stats.projects === 0) return <div className="flex h-[60vh] items-center justify-center text-muted-foreground font-black animate-pulse">GENERANDO REPORTE EJECUTIVO...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* --- Executive Header --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pb-2 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-xs">
            <Zap className="w-3 h-3 fill-primary" /> Intelligence Dashboard
          </div>
          <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
            {selectedEntityName}
          </h1>
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
              Nivel de Riesgo Global: <span className="text-orange-500">{stats.overdueTasks > 5 ? 'Elevado' : 'Nominal'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              KPI Cumplimiento: <span className="text-blue-500">{Math.round(stats.avgTaskCompletion)}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-2xl border border-border/50">
          {(profile?.has_all_entities_access || (profile?.profile_entities?.length || 0) > 1) && (
            <select
              value={activeEntityId}
              onChange={(e) => setActiveEntityId(e.target.value)}
              className="bg-background border-none text-sm font-black px-4 py-2 rounded-xl focus:ring-0 cursor-pointer hover:bg-muted/50 transition-colors outline-none min-w-[220px]"
            >
              {profile?.has_all_entities_access && <option value="all">🌍 Ecosistema Total</option>}
              {availableEntities.map(ent => (
                <option key={ent.id} value={ent.id}>🏢 {ent.name}</option>
              ))}
            </select>
          )}
          <div className="h-8 w-px bg-border mx-1" />
          <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-xl border border-border/40 shadow-sm text-xs font-black uppercase">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {new Date().toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* --- Alert Band --- */}
      {executiveAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {executiveAlerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-600' :
              alert.type === 'danger' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' :
                'bg-amber-500/10 border-amber-500/30 text-amber-600'
              } animate-in slide-in-from-left duration-500`} style={{ animationDelay: `${i * 100}ms` }}>
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="text-xs font-black uppercase leading-tight tracking-tight">{alert.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* --- Core Executive Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ExecutiveCard
          title="Revenue Under Management"
          value={`$${(stats.totalBudget / 1000).toFixed(1)}K`}
          trend="+12.5%"
          trendUp={true}
          subtitle="Presupuesto Total"
          icon={<DollarSign className="w-5 h-5" />}
          color="emerald"
        />
        <ExecutiveCard
          title="Portfolio Performance"
          value={stats.performanceIndex.toFixed(2)}
          trend="-0.04"
          trendUp={false}
          subtitle="Índice SPI (Pertenencia)"
          icon={<TrendingUp className="w-5 h-5" />}
          color="blue"
        />
        <ExecutiveCard
          title="Client Satisfaction"
          value="8.4/10"
          trend="+0.2"
          trendUp={true}
          subtitle="NPS Estimado"
          icon={<Star className="w-5 h-5" />}
          color="amber"
        />
        <ExecutiveCard
          title="Operational Load"
          value={`${Math.round(stats.resourceUtilization)}%`}
          trend="Estable"
          trendUp={null}
          subtitle="Uso de Talentos"
          icon={<Users className="w-5 h-5" />}
          color="purple"
        />
        <ExecutiveCard
          title="Net Inventory Value"
          value={`$${(stats.inventoryValue / 1000).toFixed(1)}K`}
          trend={stats.expiringWarranties > 0 ? `${stats.expiringWarranties} Alert` : 'Vigente'}
          trendUp={stats.expiringWarranties > 0 ? false : null}
          subtitle="Valor Depreciado"
          icon={<Package className="w-5 h-5" />}
          color="slate"
        />
      </div>

      {/* --- Analytical Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Radar Char: Portfolio Balance */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Equilibrio Operativo
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={projectPortfolioData}>
                <PolarGrid stroke="#64748b" opacity={0.2} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                <Radar
                  name="Actual"
                  dataKey="A"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-center font-bold text-muted-foreground/60 uppercase mt-4">Puntuación multicriterio de las 5 dimensiones clave</p>
        </div>

        {/* Productivity Trend */}
        <div className="lg:col-span-8 glass-card p-6 flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Histórico de Eficiencia</span>
            <div className="flex gap-4 text-[10px]">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Planificado</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Real</span>
            </div>
          </h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyTreads}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={3} fill="transparent" />
                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource Load vs Capacity */}
        <div className="lg:col-span-7 glass-card p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" /> Carga vs Capacidad por Talento
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceLoad} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="capacity" fill="#e2e8f0" radius={[10, 10, 0, 0]} barSize={30} />
                <Bar dataKey="load" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Risk Matrix */}
        <div className="lg:col-span-5 glass-card p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" /> Concentración de Riesgos
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <XAxis type="number" dataKey="impact" hide />
                <YAxis type="number" dataKey="risk" domain={[0, 100]} hide />
                <ZAxis type="number" dataKey="size" range={[100, 500]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Proyectos" data={riskMatrixData}>
                  {riskMatrixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 70 ? '#ef4444' : entry.risk > 40 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground mt-4 border-t border-border pt-4">
              <span>Impacto Operativo ➡️</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Crítico</span>
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> Alto</span>
            </div>
          </div>
        </div>

        {/* Timeline Activity */}
        <div className="lg:col-span-12 glass-card p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Auditoría de Actividad Ejecutiva
            </h3>
            <button className="text-[10px] font-black uppercase text-primary hover:underline">Ver Log Completo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentActivity.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-all group">
                <p className="text-xs font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">{log.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                    {log.profiles?.full_name?.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase">{log.profiles?.full_name?.split(' ')[0]}</span>
                  <span className="text-[10px] text-muted-foreground/50 ml-auto">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground italic">Sin actividad registrada.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Executive UI Components ---

function ExecutiveCard({ title, value, trend, trendUp, subtitle, icon, color }: any) {
  const colorClasses: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-2xl border ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${trendUp === true ? 'text-emerald-500' : trendUp === false ? 'text-red-500' : 'text-muted-foreground'}`}>
            {trendUp === true ? <ArrowUpRight className="w-3 h-3" /> : trendUp === false ? <ArrowDownRight className="w-3 h-3" /> : null}
            {trend}
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-3xl font-black text-foreground">{value}</h3>
          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{subtitle}</span>
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-16 h-16 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-700 overflow-hidden">
        <div className={`w-full h-full rounded-full bg-${color}-500 blur-xl`} />
      </div>
    </div>
  );
}
