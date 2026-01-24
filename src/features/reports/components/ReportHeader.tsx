'use client';

import { BarChart3, Sparkles } from 'lucide-react';
import { useSettings } from '@/shared/contexts/SettingsContext';

export function ReportHeader() {
    const { t } = useSettings();
    return (
        <div className="flex flex-col gap-8 mb-10 animate-reveal">
            <div className="flex items-center gap-5 group">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full transition-all group-hover:scale-150 duration-700" />
                    <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
                        <BarChart3 className="w-8 h-8" />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/70">Analytical Intelligence</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-foreground tracking-tight leading-none">{t('reports.title')}</h1>
                        <span className="text-[10px] py-1.5 px-4 bg-primary/10 text-primary rounded-full font-black uppercase tracking-widest shadow-sm">
                            {t('reports.subtitle')}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm mt-3">{t('reports.desc')}</p>
                </div>
            </div>
        </div>
    );
}
