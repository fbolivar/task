'use client';

import { useState, useEffect } from 'react';
import { Bell, Info } from 'lucide-react';

export interface NotificationPreferences {
    email_task_assigned: boolean;
    email_task_completed: boolean;
    inapp_all: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
    email_task_assigned: true,
    email_task_completed: true,
    inapp_all: true,
};

interface ToggleProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
}

function Toggle({ id, label, description, checked, onChange }: ToggleProps) {
    return (
        <label htmlFor={id} className="flex items-center justify-between gap-4 cursor-pointer group py-3">
            <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{label}</span>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            <div className="relative flex items-center flex-shrink-0">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="peer sr-only"
                />
                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-[#166A2F] transition-all duration-300" />
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4 shadow-sm" />
            </div>
        </label>
    );
}

interface NotificationPreferencesProps {
    userId: string;
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
    const storageKey = `notification_prefs_${userId}`;
    const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
            }
        } catch {
            // localStorage unavailable — keep defaults
        }
    }, [storageKey]);

    const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
        const updated = { ...prefs, [key]: value };
        setPrefs(updated);
        try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
            // ignore write errors
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#166A2F]" />
                    Preferencias de Notificacion
                </h3>
                {saved && (
                    <span className="text-xs font-semibold text-[#166A2F] animate-in fade-in duration-200">
                        Guardado
                    </span>
                )}
            </div>

            <div className="space-y-1">
                {/* Tareas */}
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Tareas</p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <Toggle
                        id="email_task_assigned"
                        label="Tarea asignada"
                        description="Recibir correo cuando te asignen una tarea"
                        checked={prefs.email_task_assigned}
                        onChange={(v) => updatePref('email_task_assigned', v)}
                    />
                    <Toggle
                        id="email_task_completed"
                        label="Tarea completada"
                        description="Recibir correo cuando una tarea a tu cargo sea marcada como completada"
                        checked={prefs.email_task_completed}
                        onChange={(v) => updatePref('email_task_completed', v)}
                    />
                </div>

                {/* General */}
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-4 mb-1">General</p>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    <Toggle
                        id="inapp_all"
                        label="Notificaciones en la app"
                        description="Mostrar el panel de notificaciones dentro de la aplicacion"
                        checked={prefs.inapp_all}
                        onChange={(v) => updatePref('inapp_all', v)}
                    />
                </div>
            </div>

            <div className="mt-5 flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                    Las preferencias se guardan localmente en tu navegador
                </p>
            </div>
        </div>
    );
}
