'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus, LayoutDashboard, X, ChevronRight, ChevronLeft, Sparkles, Command } from 'lucide-react';

interface WelcomeModalProps {
    userId: string;
}

interface Step {
    icon: React.ReactNode;
    title: string;
    description: string;
    hint?: React.ReactNode;
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
            setCurrentStep(prev => prev + 1);
        } else {
            handleDismiss();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const steps: Step[] = [
        {
            icon: (
                <div className="w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                    <Sparkles className="w-10 h-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Bienvenido a GestorPro',
            description: 'Tu plataforma para gestionar proyectos, tareas y equipos desde un solo lugar. En tres pasos te mostramos lo esencial.',
        },
        {
            icon: (
                <div className="w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                    <Plus className="w-10 h-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Crea tu primera tarea',
            description: 'Ve a "Tareas" y pulsa el boton "Nueva Tarea". Asignale un nombre, prioridad y fecha limite.',
            hint: (
                <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800">
                    <CheckSquare className="w-5 h-5 text-teal-500 shrink-0" aria-hidden="true" />
                    <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                        Tip: empieza con algo simple como <span className="italic">"Revisar correos del dia"</span>
                    </p>
                </div>
            ),
        },
        {
            icon: (
                <div className="w-20 h-20 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center border border-teal-100 dark:border-teal-800">
                    <LayoutDashboard className="w-10 h-10 text-teal-500" aria-hidden="true" />
                </div>
            ),
            title: 'Explora tu dashboard',
            description: 'Desde el panel principal accedes a metricas, reportes y el estado de todos tus proyectos en tiempo real.',
            hint: (
                <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800">
                        <Command className="w-5 h-5 text-teal-500 shrink-0" aria-hidden="true" />
                        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
                            Usa <kbd className="px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-xs font-mono">Ctrl+K</kbd> para busqueda rapida global
                        </p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800">
                        <Sparkles className="w-5 h-5 text-teal-500 shrink-0" aria-hidden="true" />
                        <p className="text-sm text-teal-700 dark:text-teal-300 font-medium">
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

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 animate-reveal overflow-hidden">

                {/* Teal accent bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 to-teal-600" />

                {/* Close button */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Cerrar bienvenida"
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="px-8 py-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        {step.icon}
                    </div>

                    {/* Text */}
                    <div className="text-center mb-2">
                        <h2
                            id="welcome-modal-title"
                            className="text-xl font-black text-foreground tracking-tight mb-3"
                        >
                            {step.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    {/* Contextual hint */}
                    {step.hint && (
                        <div className="mt-2">
                            {step.hint}
                        </div>
                    )}

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mt-8" role="tablist" aria-label="Pasos del tutorial">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                role="tab"
                                aria-selected={index === currentStep}
                                aria-label={`Paso ${index + 1} de ${steps.length}`}
                                onClick={() => setCurrentStep(index)}
                                className={`rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                                    index === currentStep
                                        ? 'w-6 h-2.5 bg-teal-500'
                                        : 'w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-teal-300'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="px-8 pb-8 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Omitir
                    </button>

                    <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                            <button
                                type="button"
                                onClick={handlePrev}
                                aria-label="Paso anterior"
                                className="flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                Atras
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-1.5 py-2 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold transition-colors shadow-sm shadow-teal-500/30 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                        >
                            {isLastStep ? 'Comenzar' : 'Siguiente'}
                            {!isLastStep && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
