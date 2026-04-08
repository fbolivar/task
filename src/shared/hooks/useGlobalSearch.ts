'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  type: 'project' | 'task' | 'entity' | 'asset';
  url: string;
}

export interface GroupedResults {
  projects: SearchResult[];
  tasks: SearchResult[];
  entities: SearchResult[];
  assets: SearchResult[];
}

interface DbRow { id: string; name?: string; title?: string; status?: string; category?: string }

const EMPTY_RESULTS: GroupedResults = {
  projects: [],
  tasks: [],
  entities: [],
  assets: [],
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<GroupedResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    const trimmed = query.trim();
    let cancelled = false;

    const search = async () => {
      setLoading(true);

      try {
        const supabase = createClient();
        const pattern = `%${trimmed}%`;

        const [projectsRes, tasksRes, entitiesRes, assetsRes] = await Promise.all([
          supabase
            .from('projects')
            .select('id, name, status')
            .ilike('name', pattern)
            .limit(5),

          supabase
            .from('tasks')
            .select('id, title, status')
            .ilike('title', pattern)
            .limit(5),

          supabase
            .from('entities')
            .select('id, name')
            .ilike('name', pattern)
            .limit(5),

          supabase
            .from('assets')
            .select('id, name, category')
            .ilike('name', pattern)
            .limit(5),
        ]);

        if (cancelled) return;

        const grouped: GroupedResults = {
          projects: ((projectsRes.data ?? []) as DbRow[]).map((p) => ({
            id: String(p.id),
            label: p.name || 'Sin nombre',
            sublabel: p.status ?? undefined,
            type: 'project' as const,
            url: '/proyectos',
          })),
          tasks: ((tasksRes.data ?? []) as DbRow[]).map((t) => ({
            id: String(t.id),
            label: t.title || 'Sin titulo',
            sublabel: t.status ?? undefined,
            type: 'task' as const,
            url: '/tareas',
          })),
          entities: ((entitiesRes.data ?? []) as DbRow[]).map((e) => ({
            id: String(e.id),
            label: e.name || 'Sin nombre',
            type: 'entity' as const,
            url: '/entidades',
          })),
          assets: ((assetsRes.data ?? []) as DbRow[]).map((a) => ({
            id: String(a.id),
            label: a.name || 'Sin nombre',
            sublabel: a.category ?? undefined,
            type: 'asset' as const,
            url: '/inventario',
          })),
        };

        setResults(grouped);
      } catch {
        if (!cancelled) setResults(EMPTY_RESULTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    search();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const totalCount =
    results.projects.length +
    results.tasks.length +
    results.entities.length +
    results.assets.length;

  return { results, loading, totalCount };
}
