'use client';

import { BarChart3, FileLineChart, Sparkles } from 'lucide-react';

export function ReportHeader() {
    return (
        <div className="flex flex-col gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        Inteligencia de Negocio
                        <span className="text-[10px] py-1 px-3 bg-blue-500/10 text-blue-500 rounded-full font-black uppercase tracking-widest border border-blue-500/10">
                            Executive Insights
                        </span>
                    </h1>
                    <p className="text-muted-foreground font-medium">Análisis profundo de desempeño, rentabilidad y carga operativa.</p>
                </div>
            </div>
        </div>
    );
}
