'use client';

import { useState, useEffect } from 'react';

interface WelcomeModalProps {
    userId: string;
}

const STORAGE_KEY_PREFIX = 'gespro_onboarded_';

export function WelcomeModal({ userId }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!userId) return;
        const key = `${STORAGE_KEY_PREFIX}${userId}`;
        if (!localStorage.getItem(key)) {
            setIsVisible(true);
        }
    }, [userId]);

    const dismiss = () => {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, 'true');
        setIsVisible(false);
    };

    const next = () => {
        if (step < 2) setStep(s => s + 1);
        else dismiss();
    };

    if (!isVisible) return null;

    const steps = [
        {
            title: 'Bienvenido a GestorPro',
            desc: 'Tu plataforma para gestionar proyectos, tareas y equipos desde un solo lugar.',
            tip: null,
        },
        {
            title: 'Crea tu primera tarea',
            desc: 'Usa el boton "+" en la esquina inferior derecha para crear tareas rapido. Solo escribe el titulo y listo.',
            tip: 'Tip: empieza con algo simple como "Revisar correos del dia"',
        },
        {
            title: 'Explora tu espacio',
            desc: 'Usa Ctrl+K para buscar cualquier cosa. La campana muestra tus notificaciones.',
            tip: 'El menu lateral te lleva a Proyectos, Tareas, Reportes y mas.',
        },
    ];

    const s = steps[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={dismiss} />
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
                <div className="h-1 w-full bg-primary" />
                <div className="px-6 py-6">
                    <h2 className="text-lg font-bold text-foreground mb-2">{s.title}</h2>
                    <p className="text-sm text-muted-foreground mb-3">{s.desc}</p>
                    {s.tip && (
                        <p className="text-xs text-primary bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 mb-3">
                            {s.tip}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 mb-4 justify-center">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <button type="button" onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground">
                            Omitir
                        </button>
                        <button type="button" onClick={next} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
                            {step === 2 ? 'Comenzar' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
