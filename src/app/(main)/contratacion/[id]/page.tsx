'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Edit,
    FileDown,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronUp,
    Save,
    Loader2,
    Link as LinkIcon,
    FileText,
    User as UserIcon,
    Briefcase,
    DollarSign,
    Calendar,
    TrendingUp,
    Target,
    ShieldCheck,
    AlertCircle,
    ExternalLink,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase/client';
import { hiringService } from '@/features/hiring/services/hiringService';
import { HiringModal } from '@/features/hiring/components/HiringModal';
import { ActivityTimeline } from '@/shared/components/ActivityTimeline';
import {
    HiringProcess,
    HiringProcessFormData,
    HiringPhaseTracking,
    HIRING_PHASES,
    HiringStatus,
} from '@/features/hiring/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PhaseWithProfile extends HiringPhaseTracking {
    completer?: { full_name: string } | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COP = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(amount);

const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function statusConfig(status: HiringStatus) {
    switch (status) {
        case 'Legalizado':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' };
        case 'Adjudicado':
            return { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' };
        case 'Cancelado':
            return { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' };
        default:
            return { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' };
    }
}

// ─── Phase Stepper ─────────────────────────────────────────────────────────────

function PhaseStepper({ phases }: { phases: PhaseWithProfile[] }) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="flex items-start min-w-max gap-0">
                {HIRING_PHASES.map((phaseDef, idx) => {
                    const tracking = phases.find((p) => p.phase_code === phaseDef.code);
                    const isCompleted = tracking?.is_completed ?? false;
                    const isActive = !isCompleted && HIRING_PHASES.slice(0, idx).every(
                        (prev) => phases.find((p) => p.phase_code === prev.code)?.is_completed
                    );
                    const isLast = idx === HIRING_PHASES.length - 1;

                    return (
                        <div key={phaseDef.code} className="flex items-start">
                            {/* Step node */}
                            <div className="flex flex-col items-center w-28">
                                {/* Icon */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : isActive
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <span className="text-[11px] font-black">{idx + 1}</span>
                                    )}
                                </div>
                                {/* Name */}
                                <p className={`mt-2 text-[9px] font-black uppercase tracking-tight text-center leading-tight w-24 ${isCompleted
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground'
                                    }`}>
                                    {phaseDef.name}
                                </p>
                                {/* Weight */}
                                <p className="text-[9px] text-muted-foreground/60 font-bold mt-0.5">{phaseDef.weight}%</p>
                                {/* Date */}
                                {isCompleted && tracking?.completed_at && (
                                    <p className="text-[8px] text-emerald-600/80 dark:text-emerald-400/70 font-bold mt-1 text-center">
                                        {fmtDate(tracking.completed_at)}
                                    </p>
                                )}
                                {isActive && (
                                    <span className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-primary/10 text-primary">
                                        Activa
                                    </span>
                                )}
                            </div>
                            {/* Connector */}
                            {!isLast && (
                                <div className="flex-shrink-0 mt-5 w-8">
                                    <div className={`h-0.5 w-full transition-colors duration-300 ${isCompleted ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Phase Accordion Item ─────────────────────────────────────────────────────

interface PhaseAccordionItemProps {
    phaseDef: typeof HIRING_PHASES[number];
    tracking: PhaseWithProfile | undefined;
    processId: string;
    onSaved: () => void;
}

function PhaseAccordionItem({ phaseDef, tracking, processId, onSaved }: PhaseAccordionItemProps) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState(tracking?.notes ?? '');
    const [evidenceLink, setEvidenceLink] = useState(tracking?.evidence_link ?? '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isCompleted = tracking?.is_completed ?? false;

    const handleSave = async () => {
        if (!tracking) return;
        setSaving(true);
        try {
            const supabase = createClient();
            await supabase
                .from('hiring_phases_tracking')
                .update({ notes, evidence_link: evidenceLink || null })
                .eq('id', tracking.id);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onSaved();
        } catch (err) {
            console.error('Error saving phase notes:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all duration-200 ${isCompleted
            ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/5'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
            {/* Header */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                aria-expanded={open}
            >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground truncate">{phaseDef.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Peso: {phaseDef.weight}%
                        {isCompleted && tracking?.completed_at && ` · Completada ${fmtDate(tracking.completed_at)}`}
                        {isCompleted && tracking?.completer && ` · ${tracking.completer.full_name}`}
                    </p>
                </div>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border flex-shrink-0 ${isCompleted
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}>
                    {isCompleted ? 'Completada' : 'Pendiente'}
                </span>
                <div className="text-muted-foreground flex-shrink-0">
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>

            {/* Expanded Content */}
            {open && (
                <div className="px-5 pb-5 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Notas y Observaciones
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Agrega notas sobre esta fase..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Enlace de Evidencia
                        </label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="url"
                                value={evidenceLink}
                                onChange={(e) => setEvidenceLink(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium focus:outline-none focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !tracking}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar Cambios'}
                        </button>
                        {evidenceLink && (
                            <a
                                href={evidenceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Ver evidencia
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────

function generateProcessPDF(process: HiringProcess, phasesWithProfiles: PhaseWithProfile[]) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [79, 70, 229];
    const darkColor: [number, number, number] = [15, 23, 42];

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESO DE CONTRATACIÓN', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(process.title.toUpperCase(), 15, 30, { maxWidth: 180 });

    const statusLabel = `Estado: ${process.status}  |  Avance: ${process.total_progress}%`;
    doc.text(statusLabel, 15, 40);

    // Process Info
    let y = 65;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. INFORMACIÓN DEL PROCESO', 15, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    autoTable(doc, {
        startY: y,
        head: [['Campo', 'Valor']],
        body: [
            ['Título', process.title],
            ['Estado', process.status],
            ['Avance Total', `${process.total_progress}%`],
            ['Proyecto Vinculado', process.project?.name ?? 'Operación Directa'],
            ['Responsable', process.assignee?.full_name ?? 'Sin Asignar'],
            ['Valor Estimado', COP(process.estimated_amount)],
            ['Creado', fmtDate(process.created_at)],
            ['Última actualización', fmtDate(process.updated_at)],
            ['Descripción', process.description ?? '—'],
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Phase Table
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('2. SEGUIMIENTO DE FASES', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    const phaseRows = HIRING_PHASES.map((phaseDef) => {
        const tracking = phasesWithProfiles.find((p) => p.phase_code === phaseDef.code);
        return [
            phaseDef.name,
            `${phaseDef.weight}%`,
            tracking?.is_completed ? 'Completada' : 'Pendiente',
            fmtDate(tracking?.completed_at ?? null),
            tracking?.completer?.full_name ?? '—',
            tracking?.notes ?? '—',
        ];
    });

    autoTable(doc, {
        startY: y,
        head: [['Fase', 'Peso', 'Estado', 'Fecha', 'Completada por', 'Notas']],
        body: phaseRows,
        theme: 'striped',
        headStyles: { fillColor: darkColor, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, cellPadding: 3 },
        columnStyles: {
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'center', cellWidth: 22 },
            4: { cellWidth: 30 },
        },
    });

    // Footer
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text(
            `Generado el ${new Date().toLocaleString('es-CO')} · Página ${i} de ${pageCount}`,
            105, 290, { align: 'center' }
        );
    }

    doc.save(`Contratacion_${process.title.replace(/\s+/g, '_').slice(0, 30)}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HiringDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    const [process, setProcess] = useState<HiringProcess | null>(null);
    const [phasesWithProfiles, setPhasesWithProfiles] = useState<PhaseWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);

    const fetchProcess = useCallback(async () => {
        try {
            setLoading(true);
            const data = await hiringService.getProcessById(id);

            // Enrich phases with completer profile name
            const phases = data.phases ?? [];
            const completerIds = phases
                .filter((p) => p.completed_by)
                .map((p) => p.completed_by as string);

            let profilesMap: Record<string, string> = {};
            if (completerIds.length > 0) {
                const supabase = createClient();
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', completerIds);
                if (profiles) {
                    profiles.forEach((pr: { id: string; full_name: string }) => {
                        profilesMap[pr.id] = pr.full_name;
                    });
                }
            }

            const enriched: PhaseWithProfile[] = phases.map((phase) => ({
                ...phase,
                completer: phase.completed_by
                    ? { full_name: profilesMap[phase.completed_by] ?? 'Desconocido' }
                    : null,
            }));

            setProcess(data);
            setPhasesWithProfiles(enriched);
            setError(null);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar el proceso';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchProcess();
    }, [fetchProcess]);

    const handleSaveEdit = async (data: HiringProcessFormData) => {
        await hiringService.updateProcess(id, data);
        await fetchProcess();
    };

    const handleUpdatePhase = async (processId: string, code: string, completed: boolean) => {
        await hiringService.updatePhaseStatus(processId, code, completed);
        await fetchProcess();
    };

    const handleExportPDF = async () => {
        if (!process) return;
        setExportingPdf(true);
        try {
            generateProcessPDF(process, phasesWithProfiles);
        } finally {
            setExportingPdf(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                    Cargando proceso de contratación
                </p>
            </div>
        );
    }

    // ── Error ──
    if (error || !process) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="text-sm font-bold text-muted-foreground">{error ?? 'Proceso no encontrado'}</p>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary hover:underline"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver
                </button>
            </div>
        );
    }

    const sc = statusConfig(process.status);

    // ── Render ──
    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in duration-300">

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-start gap-5">
                    <button
                        onClick={() => router.push('/contratacion')}
                        className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                        aria-label="Volver a contratación"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sc.bg} ${sc.text} ${sc.border}`}>
                                {process.status}
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                {process.total_progress}% Avance
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tighter leading-tight max-w-2xl">
                            {process.title}
                        </h1>
                        <div className="mt-3 w-full max-w-lg">
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${process.total_progress}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1.5">
                                {process.total_progress}% completado · {COP(process.estimated_amount)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={handleExportPDF}
                        disabled={exportingPdf}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-black uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm disabled:opacity-60"
                    >
                        {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        PDF
                    </button>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Edit className="w-4 h-4" />
                        Editar
                    </button>
                </div>
            </div>

            {/* ── Section 1: Phase Timeline (full width) ─────────────────────── */}
            <section
                aria-labelledby="phase-timeline-heading"
                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-7">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Target className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                        <h2 id="phase-timeline-heading" className="text-sm font-black text-foreground uppercase tracking-widest">
                            Línea de Fases Operativas
                        </h2>
                        <p className="text-[10px] font-bold text-muted-foreground">
                            {phasesWithProfiles.filter((p) => p.is_completed).length} de {HIRING_PHASES.length} fases completadas
                        </p>
                    </div>
                </div>
                <PhaseStepper phases={phasesWithProfiles} />
            </section>

            {/* ── Section 2: Info Cards (2 columns) ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Process details */}
                <section
                    aria-labelledby="process-details-heading"
                    className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5"
                >
                    <h2 id="process-details-heading" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Detalles del Proceso
                    </h2>

                    <div className="space-y-4">
                        {/* Title */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary border border-slate-100 dark:border-white/5 shadow-sm flex-shrink-0">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Título</p>
                                <p className="text-sm font-black text-foreground">{process.title}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {process.description && (
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1.5">Descripción</p>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{process.description}</p>
                            </div>
                        )}

                        {/* Project */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-white/5 shadow-sm flex-shrink-0">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Proyecto Vinculado</p>
                                <p className="text-sm font-black text-foreground">{process.project?.name ?? 'Operación Directa'}</p>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-500 border border-slate-100 dark:border-white/5 shadow-sm flex-shrink-0">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Responsable</p>
                                <p className="text-sm font-black text-foreground">{process.assignee?.full_name ?? 'Sin Asignar'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right: Financial summary */}
                <section
                    aria-labelledby="financial-summary-heading"
                    className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5"
                >
                    <h2 id="financial-summary-heading" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Resumen Financiero y Estado
                    </h2>

                    <div className="space-y-4">
                        {/* Estimated Amount */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/10">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary border border-primary/10 shadow-sm flex-shrink-0">
                                <DollarSign className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Valor Estimado</p>
                                <p className="text-lg font-black text-foreground tracking-tight">{COP(process.estimated_amount)}</p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm flex-shrink-0 ${sc.text}`}>
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Estado General</p>
                                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${sc.bg} ${sc.text} ${sc.border}`}>
                                    {process.status}
                                </span>
                            </div>
                        </div>

                        {/* Created */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-amber-500 border border-slate-100 dark:border-white/5 shadow-sm flex-shrink-0">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none mb-1">Registro</p>
                                <p className="text-sm font-black text-foreground">{fmtDate(process.created_at)}</p>
                                <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
                                    Actualizado: {fmtDate(process.updated_at)}
                                </p>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/70 tracking-widest leading-none">
                                    Progreso Total
                                </p>
                                <span className="text-lg font-black text-primary">{process.total_progress}%</span>
                            </div>
                            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${process.total_progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── Section 3: Phase Details Accordion ──────────────────────────── */}
            <section aria-labelledby="phases-accordion-heading">
                <div className="flex items-center gap-3 mb-5">
                    <h2 id="phases-accordion-heading" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Detalle por Fase
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
                <div className="space-y-3">
                    {HIRING_PHASES.map((phaseDef) => {
                        const tracking = phasesWithProfiles.find((p) => p.phase_code === phaseDef.code);
                        return (
                            <PhaseAccordionItem
                                key={phaseDef.code}
                                phaseDef={phaseDef}
                                tracking={tracking}
                                processId={process.id}
                                onSaved={fetchProcess}
                            />
                        );
                    })}
                </div>
            </section>

            {/* ── Section 4: Activity Timeline ─────────────────────────────────── */}
            <section aria-labelledby="activity-heading">
                <div className="flex items-center gap-3 mb-5">
                    <h2 id="activity-heading" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Historial de Actividad
                    </h2>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
                <ActivityTimeline entityType="hiring_process" entityId={process.id} maxItems={30} />
            </section>

            {/* ── Edit Modal ────────────────────────────────────────────────────── */}
            <HiringModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEdit}
                onUpdatePhase={handleUpdatePhase}
                process={process}
                entityId={process.entity_id}
                readOnly={false}
            />
        </div>
    );
}
