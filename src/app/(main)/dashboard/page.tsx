'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { AdminDashboard } from '@/features/dashboard/components/AdminDashboard';
import { OperativoDashboard } from '@/features/dashboard/components/OperativoDashboard';
import { Zap, ShieldAlert, Target, ArrowDownRight, Package } from 'lucide-react';

export default function DashboardPage() {
  const { profile, activeEntityId, setActiveEntityId } = useAuthStore();
  const { stats, chartsData, loading } = useDashboardData();
  const [availableEntities, setAvailableEntities] = useState<{ id: string, name: string }[]>([]);
  const supabase = createClient();

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

  const selectedEntityName = useMemo(() => {
    if (activeEntityId === 'all') return 'Consolidado Corporativo';
    return availableEntities.find(e => e.id === activeEntityId)?.name || 'Entidad';
  }, [activeEntityId, availableEntities]);

  if (loading && stats.projects === 0) return (
    <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-primary font-black animate-pulse text-2xl tracking-tighter uppercase">Sincronizando Inteligencia...</div>
    </div>
  );

  const isOperativo = profile?.role?.name === 'Operativo';

  return (
    <div className="space-y-10 pb-10">

      {/* --- Executive Header --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 group animate-in slide-in-from-top-4 duration-700">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-primary font-bold uppercase tracking-[0.3em] text-[10px] bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10 hover:bg-primary/10 transition-colors">
            <Zap className="w-3 h-3 fill-primary animate-pulse" /> {isOperativo ? 'Operational Center' : 'Platform Analytics'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
            {isOperativo ? `Hola, ${profile?.full_name?.split(' ')[0]}` : selectedEntityName}
          </h1>
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/80">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Estado: <span className="text-foreground">{stats.overdueTasks > 5 ? '⚠️ Riesgo' : '✅ Nominal'}</span>
            </div>
            {!isOperativo && (
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/80">
                <Target className="w-4 h-4 text-primary" />
                Cumplimiento: <span className="text-foreground">{Math.round(stats.avgTaskCompletion)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Entity Selector - Only for those who can switch, keeping available for Operativo if they have multiple entities but maybe simplified */}
        {!isOperativo && (profile?.has_all_entities_access || (profile?.profile_entities?.length || 0) > 1) && (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
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
          </div>
        )}
      </div>

      {/* --- Dynamic Dashboard Content --- */}
      {isOperativo ? (
        <OperativoDashboard stats={stats} chartsData={chartsData} />
      ) : (
        <AdminDashboard stats={stats} chartsData={chartsData} />
      )}

    </div>
  );
}
