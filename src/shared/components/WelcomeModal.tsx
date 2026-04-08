'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    CheckSquare,
    Plus,
    LayoutDashboard,
    X,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Command,
    Video,
    Search,
    BarChart2,
    Pause,
    Play,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// VideoTour – animated slideshow simulating a 60-second product tour
// ---------------------------------------------------------------------------

interface TourSlide {
    icon: React.ReactNode;
    headline: string;
    mockup: React.ReactNode;
}

const TOUR_SLIDES: TourSlide[] = [
    {
        icon: <Plus className="w-12 h-12 text-teal-400" aria-hidden="true" />,
        headline: 'Crea tareas con el botón +',
        mockup: (
            <div className="flex flex-col gap-1.5 w-52 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="h-2.5 w-36 rounded bg-white/20" />
                <div className="h-2 w-24 rounded bg-white/10" />
                <div className="mt-1 flex gap-1.5">
                    <span className="rounded-full bg-teal-500/30 px-2 py-0.5 text-[10px] text-teal-300">Alta</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">Hoy</span>
                </div>
            </div>
        ),
    },
    {
        icon: <LayoutDashboard className="w-12 h-12 text-indigo-400" aria-hidden="true" />,
        headline: 'Organiza en tablero Kanban',
        mockup: (
            <div className="flex gap-2">
                {['Pendiente', 'En curso', 'Revisión', 'Listo'].map((col) => (
                    <div key={col} className="flex flex-col gap-1.5 w-16">
                        <div className="text-[9px] text-white/40 font-semibold uppercase tracking-wide truncate">{col}</div>
                        <div className="h-7 rounded-lg border border-white/10 bg-white/[0.08]" />
                        <div className="h-7 rounded-lg border border-white/10 bg-white/[0.08]" />
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: <Search className="w-12 h-12 text-purple-400" aria-hidden="true" />,
        headline: 'Busca con Ctrl+K',
        mockup: (
            <div className="flex items-center gap-2 w-56 rounded-xl border border-white/20 bg-white/[0.08] px-3 py-2">
                <Search className="w-4 h-4 shrink-0 text-white/30" aria-hidden="true" />
                <span className="flex-1 text-sm text-white/30">Buscar tareas, proyectos…</span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/40">⌘K</kbd>
            </div>
        ),
    },
    {
        icon: <BarChart2 className="w-12 h-12 text-emerald-400" aria-hidden="true" />,
        headline: 'Revisa tus reportes',
        mockup: (
            <div className="flex h-14 w-48 items-end gap-2">
                {[40, 70, 55, 90, 65, 80, 50].map((heightPct, i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-t-sm border-t border-emerald-400/60 bg-emerald-500/40 ${BAR_HEIGHTS[heightPct]}`}
                    />
                ))}
            </div>
        ),
    },
];

// Pre-mapped Tailwind height classes so we never use inline styles for the bars.
// Keys are the percentage values used above.
const BAR_HEIGHTS: Record<number, string> = {
    40: 'h-[40%]',
    70: 'h-[70%]',
    55: 'h-[55%]',
    90: 'h-[90%]',
    65: 'h-[65%]',
    80: 'h-[80%]',
    50: 'h-[50%]',
};

const SLIDE_DURATION_MS = 3000;
const TOTAL_SLIDES = TOUR_SLIDES.length;

function VideoTour() {
    const [slideIndex, setSlideIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [progressPct, setProgressPct] = useState(0);

    const elapsedRef = useRef(0);
    const lastTickRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const tick = useCallback(
        (timestamp: number) => {
            if (paused) {
                lastTickRef.current = null;
                return;
            }

            if (lastTickRef.current !== null) {
                elapsedRef.current += timestamp - lastTickRef.current;
            }
            lastTickRef.current = timestamp;

            const pct = Math.min(elapsedRef.current / SLIDE_DURATION_MS, 1);
            setProgressPct(Math.round(pct * 100));

            if (elapsedRef.current >= SLIDE_DURATION_MS) {
                elapsedRef.current = 0;
                setSlideIndex((prev) => (prev + 1) % TOTAL_SLIDES);
            }

            rafRef.current = requestAnimationFrame(tick);
        },
        [paused],
    );

    useEffect(() => {
        elapsedRef.current = 0;
        lastTickRef.current = null;
    }, [slideIndex]);

    useEffect(() => {
        if (!paused) {
            rafRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [paused, tick]);

    const goToSlide = (i: number) => {
        elapsedRef.current = 0;
        setSlideIndex(i);
    };

    const slide = TOUR_SLIDES[slideIndex];

    return (
        // Plain div — no ARIA role that would forbid interactive children
        <div
            className="relative w-full aspect-video overflow-hidden rounded-xl bg-slate-900 border border-white/[0.08]"
            aria-label={`Tour de producto – ${slide.headline}`}
        >
            {/* Visually hidden accessible label kept in sync with current slide */}
            <span className="sr-only">{slide.headline}</span>

            {/* Slide content */}
            <div
                key={slideIndex}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 animate-fade-in"
            >
                {slide.icon}
                <p className="text-center text-base font-bold leading-snug text-white">
                    {slide.headline}
                </p>
                <div className="flex justify-center">{slide.mockup}</div>
            </div>

            {/* Slide counter – top right */}
            <div
                className="absolute right-3 top-3 select-none font-mono text-[10px] tabular-nums text-white/30"
                aria-hidden="true"
            >
                {slideIndex + 1}&nbsp;/&nbsp;{TOTAL_SLIDES}
            </div>

            {/* Play / Pause button */}
            <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Reproducir tour' : 'Pausar tour'}
                className="absolute bottom-6 right-3 rounded-full bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
                {paused
                    ? <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    : <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                }
            </button>

            {/* Dot navigation */}
            <div className="absolute bottom-[22px] left-0 right-8 flex justify-center gap-1.5">
                {TOUR_SLIDES.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Ir a pantalla ${i + 1}`}
                        aria-pressed={i === slideIndex ? 'true' : 'false'}
                        onClick={() => goToSlide(i)}
                        className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 ${
                            i === slideIndex
                                ? 'h-1.5 w-4 bg-teal-400'
                                : 'h-1.5 w-1.5 bg-white/25 hover:bg-white/40'
                        }`}
                    />
                ))}
            </div>

            {/* Segmented progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10" aria-hidden="true">
                <div className="absolute inset-0 flex">
                    {TOUR_SLIDES.map((_, i) => (
                        <ProgressSegment
                            key={i}
                            filled={i < slideIndex}
                            active={i === slideIndex}
                            progressPct={progressPct}
                        />
                    ))}
                </div>
                {/* segment dividers */}
                <div className="absolute inset-0 flex">
                    {TOUR_SLIDES.slice(0, -1).map((_, i) => (
                        <div key={i} className="flex-1 border-r border-slate-900/60" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProgressSegment({
    filled,
    active,
    progressPct,
}: {
    filled: boolean;
    active: boolean;
    progressPct: number;
}) {
    return (
        <div className="relative flex-1 overflow-hidden">
            {filled && <div className="absolute inset-0 bg-teal-400/70" />}
            {active && (
                /*
                 * <meter> carries its fill level as an HTML attribute (value/max),
                 * so no inline style is needed for the runtime width.
                 * appearance-none lets us fully style it via pseudo-element classes.
                 */
                <meter
                    min={0}
                    max={100}
                    value={progressPct}
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 h-full w-full appearance-none
                        [&::-webkit-meter-bar]:h-full
                        [&::-webkit-meter-bar]:rounded-none
                        [&::-webkit-meter-bar]:border-0
                        [&::-webkit-meter-bar]:bg-transparent
                        [&::-webkit-meter-optimum-value]:h-full
                        [&::-webkit-meter-optimum-value]:rounded-none
                        [&::-webkit-meter-optimum-value]:bg-teal-400
                        [&::-moz-meter-bar]:h-full
                        [&::-moz-meter-bar]:rounded-none
                        [&::-moz-meter-bar]:bg-teal-400"
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// WelcomeModal
// ---------------------------------------------------------------------------

interface WelcomeModalProps {
    userId: string;
}

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    hint?: React.ReactNode;
    /** When true the modal grows to max-w-lg to fit wide content */
    wide?: boolean;
}

const STORAGE_KEY_PREFIX = 'gespro_onboarded_';

export function WelcomeModal({ userId }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const key = `${STORAGE_KEY_PREFIX}${userId}`;
        const alreadyOnboarded = localStorage.getItem(key);
        if (!alreadyOnboarded) {
            setIsVisible(true);
        }
    }, [userId]);

    const handleDismiss = () => {
        const key = `${STORAGE_KEY_PREFIX}${userId}`;
        localStorage.setItem(key, 'true');
        setIsVisible(false);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleDismiss();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const steps: Step[] = [
        // Step 1 – Welcome
        {
            icon: (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50">
                    <Sparkles className="h-10 w-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Bienvenido a GestorPro',
            description:
                'Tu plataforma para gestionar proyectos, tareas y equipos desde un solo lugar. En tres pasos te mostramos lo esencial.',
        },
        // Step 2 – Video tour (NEW)
        {
            icon: (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50">
                    <Video className="h-10 w-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Tour rápido de 60 segundos',
            description: 'Mira este video corto para conocer las funciones principales.',
            hint: (
                <div className="mt-4">
                    <VideoTour />
                </div>
            ),
            wide: true,
        },
        // Step 3 – Create first task (was step 2)
        {
            icon: (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50">
                    <Plus className="h-10 w-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Crea tu primera tarea',
            description: 'Ve a "Tareas" y pulsa el boton "Nueva Tarea". Asignale un nombre, prioridad y fecha limite.',
            hint: (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-800 dark:bg-teal-950/40">
                    <CheckSquare className="h-5 w-5 shrink-0 text-teal-500" aria-hidden="true" />
                    <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        Tip: empieza con algo simple como{' '}
                        <span className="italic">"Revisar correos del dia"</span>
                    </p>
                </div>
            ),
        },
        // Step 4 – Explore dashboard (was step 3)
        {
            icon: (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/50">
                    <LayoutDashboard className="h-10 w-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Explora tu dashboard',
            description:
                'Desde el panel principal accedes a metricas, reportes y el estado de todos tus proyectos en tiempo real.',
            hint: (
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-800 dark:bg-teal-950/40">
                        <Command className="h-5 w-5 shrink-0 text-teal-500" aria-hidden="true" />
                        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            Usa{' '}
                            <kbd className="rounded bg-teal-100 px-1.5 py-0.5 font-mono text-xs dark:bg-teal-900">
                                Ctrl+K
                            </kbd>{' '}
                            para busqueda rapida global
                        </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 dark:border-teal-800 dark:bg-teal-950/40">
                        <Sparkles className="h-5 w-5 shrink-0 text-teal-500" aria-hidden="true" />
                        <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                            El icono de campana muestra tus notificaciones pendientes
                        </p>
                    </div>
                </div>
            ),
        },
    ];

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    if (!isVisible) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleDismiss}
                aria-hidden="true"
            />

            {/* Modal – widens to max-w-lg on the video step */}
            <div
                className={`relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 animate-reveal overflow-hidden transition-all duration-300 ${
                    step.wide ? 'max-w-lg' : 'max-w-md'
                }`}
            >
                {/* Teal accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-teal-600" />

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Cerrar bienvenida"
                    className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                    <X className="h-4 w-4" />
                </button>

                {/* Content */}
                <div className="px-8 py-8">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">{step.icon}</div>

                    {/* Text */}
                    <div className="mb-2 text-center">
                        <h2
                            id="welcome-modal-title"
                            className="mb-3 text-xl font-black tracking-tight text-foreground"
                        >
                            {step.title}
                        </h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                        </p>
                    </div>

                    {/* Contextual hint */}
                    {step.hint && <div className="mt-2">{step.hint}</div>}

                    {/* Dots indicator */}
                    <div
                        className="mt-8 flex justify-center gap-2"
                        role="tablist"
                        aria-label="Pasos del tutorial"
                    >
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                role="tab"
                                aria-selected={index === currentStep ? 'true' : 'false'}
                                aria-label={`Paso ${index + 1} de ${steps.length}`}
                                onClick={() => setCurrentStep(index)}
                                className={`rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                                    index === currentStep
                                        ? 'h-2.5 w-6 bg-teal-500'
                                        : 'h-2.5 w-2.5 bg-slate-200 hover:bg-teal-300 dark:bg-slate-700'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-3 px-8 pb-8">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                    >
                        Omitir
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={handlePrev}
                                aria-label="Paso anterior"
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                Atras
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-1.5 rounded-xl bg-teal-500 px-5 py-2 text-sm font-bold text-white shadow-sm shadow-teal-500/30 transition-colors hover:bg-teal-600 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        >
                            {isLastStep ? 'Comenzar' : 'Siguiente'}
                            {!isLastStep && <ChevronRight className="h-4 w-4" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
