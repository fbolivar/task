'use client';

import { useState, useRef, useEffect } from 'react';
import { aiAssistantService, AIAnalysisResponse, AIHistoryEntry } from '../services/aiAssistantService';
import { ReportStats } from '../types';
import {
    BrainCircuit,
    Send,
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Clock,
    MessageSquare,
    Loader2,
    History,
    ChevronRight
} from 'lucide-react';

interface Props {
    stats: ReportStats | null;
    entityName?: string;
    trendData?: { month: string; amount: number }[];
}

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    suggestions?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
    timestamp: Date;
}

export function AIExecutiveAssistant({ stats, entityName, trendData }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<AIHistoryEntry[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiAssistantService.analyzeReport({
                query: input,
                stats,
                entityName,
                trendData
            });

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: response.response,
                suggestions: response.suggestions,
                riskLevel: response.riskLevel,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInput(suggestion);
    };

    const loadHistory = async () => {
        try {
            const data = await aiAssistantService.getHistory(5);
            setHistory(data);
            setShowHistory(true);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const quickPrompts = [
        'Dame un resumen ejecutivo',
        '¿Cómo está el rendimiento del equipo?',
        'Analiza los gastos del período',
        '¿Cuál es el estado de los proyectos?'
    ];

    const riskColors = {
        low: 'text-emerald-500 bg-emerald-500/10',
        medium: 'text-amber-500 bg-amber-500/10',
        high: 'text-rose-500 bg-rose-500/10'
    };

    const riskIcons = {
        low: CheckCircle2,
        medium: Clock,
        high: AlertTriangle
    };

    return (
        <div className="glass-card overflow-hidden border-t-4 border-t-primary">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-primary/5 to-indigo-500/5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                Asistente Ejecutivo IA
                                <Sparkles className="w-4 h-4 text-primary" />
                            </h3>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Análisis Inteligente de Reportes en Tiempo Real
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadHistory}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                    >
                        <History className="w-4 h-4" />
                        Historial
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-10 h-10 text-primary/40" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-foreground">¿En qué puedo ayudarte?</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Pregúntame sobre el rendimiento, finanzas o estado de operaciones
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center max-w-md">
                            {quickPrompts.map((prompt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(prompt)}
                                    className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary transition-all"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${msg.type === 'user'
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                        }`}
                                >
                                    {msg.type === 'assistant' && msg.riskLevel && (
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase mb-3 ${riskColors[msg.riskLevel]}`}>
                                            {(() => {
                                                const Icon = riskIcons[msg.riskLevel];
                                                return <Icon className="w-3 h-3" />;
                                            })()}
                                            Riesgo {msg.riskLevel === 'low' ? 'Bajo' : msg.riskLevel === 'medium' ? 'Medio' : 'Alto'}
                                        </div>
                                    )}
                                    <div className={`text-sm whitespace-pre-wrap ${msg.type === 'user' ? '' : 'text-foreground'}`}>
                                        {msg.content}
                                    </div>
                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">Acciones Sugeridas:</p>
                                            {msg.suggestions.map((s, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSuggestionClick(s)}
                                                    className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-primary/5 transition-colors text-xs text-muted-foreground hover:text-primary"
                                                >
                                                    <ChevronRight className="w-3 h-3" />
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Analizando datos...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Escribe tu consulta ejecutiva..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[60vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h4 className="text-lg font-black text-foreground">Historial de Consultas</h4>
                        </div>
                        <div className="p-4 space-y-3 max-h-[40vh] overflow-y-auto">
                            {history.length > 0 ? (
                                history.map((h) => (
                                    <div key={h.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
                                        <p className="text-xs font-bold text-primary">{h.query}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{h.response.substring(0, 150)}...</p>
                                        <p className="text-[10px] text-muted-foreground/50">
                                            {new Date(h.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground text-sm py-8">Sin historial</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-full py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
