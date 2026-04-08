'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Folder,
  CheckSquare,
  Building2,
  Package,
  GitBranch,
  X,
  Loader2,
} from 'lucide-react';
import { useGlobalSearch, type SearchResult, type GroupedResults } from '@/shared/hooks/useGlobalSearch';

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Section meta ─────────────────────────────────────────────────────────────
interface SectionMeta {
  key: keyof GroupedResults;
  label: string;
  Icon: React.ElementType;
}

const SECTIONS: SectionMeta[] = [
  { key: 'projects',  label: 'Proyectos',         Icon: Folder      },
  { key: 'tasks',     label: 'Tareas',             Icon: CheckSquare },
  { key: 'entities',  label: 'Entidades',          Icon: Building2   },
  { key: 'assets',    label: 'Inventario',         Icon: Package     },
  { key: 'changes',   label: 'Cambios',            Icon: GitBranch   },
];

// ─── Result row ───────────────────────────────────────────────────────────────
interface ResultRowProps {
  result: SearchResult;
  Icon: React.ElementType;
  isFocused: boolean;
  onSelect: (result: SearchResult) => void;
  onMouseEnter: () => void;
}

function ResultRow({ result, Icon, isFocused, onSelect, onMouseEnter }: ResultRowProps) {
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={() => onSelect(result)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-100 ${
        isFocused
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${
          isFocused ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      />
      <span className="flex-1 truncate text-sm font-medium">{result.label}</span>
      {result.sublabel && (
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 truncate max-w-[100px]">
          {result.sublabel}
        </span>
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const debouncedQuery = useDebounce(inputValue, 300);
  const { results, loading, totalCount } = useGlobalSearch(debouncedQuery);

  const inputRef = useRef<HTMLInputElement>(null);

  // Build flat list for keyboard navigation
  const flatResults: Array<{ result: SearchResult; Icon: React.ElementType }> =
    SECTIONS.flatMap(({ key, Icon }) =>
      results[key].map((r) => ({ result: r, Icon }))
    );

  // ── Open / close helpers ────────────────────────────────────────────────────
  const openModal = useCallback(() => {
    setOpen(true);
    setInputValue('');
    setFocusedIndex(-1);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setInputValue('');
    setFocusedIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      router.push(result.url);
      closeModal();
    },
    [router, closeModal]
  );

  // ── Global keyboard shortcut Ctrl+K / Cmd+K ─────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        open ? closeModal() : openModal();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, openModal, closeModal]);

  // ── Focus input when modal opens ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // Small delay to let the DOM paint first
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  // ── Reset focused index when results change ─────────────────────────────────
  useEffect(() => {
    setFocusedIndex(-1);
  }, [debouncedQuery]);

  // ── Modal keyboard navigation ───────────────────────────────────────────────
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      closeModal();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === 'Enter' && focusedIndex >= 0 && flatResults[focusedIndex]) {
      handleSelect(flatResults[focusedIndex].result);
    }
  };

  // ── Compute global index offset per section ─────────────────────────────────
  const sectionOffsets: Partial<Record<keyof GroupedResults, number>> = {};
  let offset = 0;
  for (const { key } of SECTIONS) {
    sectionOffsets[key] = offset;
    offset += results[key].length;
  }

  const hasResults = totalCount > 0;
  const showEmpty =
    debouncedQuery.trim().length >= 2 && !loading && !hasResults;

  return (
    <>
      {/* ── Trigger button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openModal}
        aria-label="Abrir búsqueda global"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm transition-colors duration-150 group"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline font-medium">Buscar...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-400 dark:text-slate-500 font-sans">
          <span className="text-[10px]">Ctrl</span>
          <span className="text-[10px]">K</span>
        </kbd>
      </button>

      {/* ── Modal overlay ───────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Búsqueda global"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              {loading ? (
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar proyectos, tareas, entidades..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={onInputKeyDown}
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  aria-label="Limpiar búsqueda"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar búsqueda"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <kbd className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-sans cursor-pointer">
                  ESC
                </kbd>
              </button>
            </div>

            {/* Results area */}
            <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">

              {/* Idle state */}
              {!debouncedQuery.trim() && (
                <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  Escribe para buscar en todo el sistema
                </p>
              )}

              {/* Loading */}
              {loading && debouncedQuery.trim().length >= 2 && (
                <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  Buscando...
                </p>
              )}

              {/* Empty */}
              {showEmpty && (
                <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  Sin resultados para{' '}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    &ldquo;{debouncedQuery}&rdquo;
                  </span>
                </p>
              )}

              {/* Grouped results */}
              {!loading && hasResults &&
                SECTIONS.map(({ key, label, Icon }) => {
                  const items = results[key];
                  if (!items.length) return null;
                  const sectionStart = sectionOffsets[key] ?? 0;

                  return (
                    <section key={key} className="mb-3 last:mb-0">
                      <h3 className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {label}
                      </h3>
                      <ul role="list">
                        {items.map((result, idx) => {
                          const globalIdx = sectionStart + idx;
                          return (
                            <li key={result.id}>
                              <ResultRow
                                result={result}
                                Icon={Icon}
                                isFocused={focusedIndex === globalIdx}
                                onSelect={handleSelect}
                                onMouseEnter={() => setFocusedIndex(globalIdx)}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
            </div>

            {/* Footer hint */}
            {hasResults && (
              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">
                    ↑↓
                  </kbd>{' '}
                  navegar
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">
                    Enter
                  </kbd>{' '}
                  ir
                </span>
                <span>
                  <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">
                    ESC
                  </kbd>{' '}
                  cerrar
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
