'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { TaskComment } from '../types';
import { commentService } from '../services/commentService';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface CommentsSectionProps {
    taskId: string;
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
    const { t } = useSettings();
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await commentService.getComments(taskId);
            setComments(data);
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchComments();
        }
    }, [taskId]);

    // Scroll to bottom when comments change
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setSending(true);
            const comment = await commentService.addComment(taskId, newComment);
            setComments(prev => [...prev, comment]);
            setNewComment('');
        } catch (error) {
            console.error('Error sending comment:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">Actividad y Comentarios</h4>
                <span className="text-xs font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-muted-foreground">
                    {comments.length}
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[300px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
                        <MessageSquare className="w-8 h-8" />
                        <span className="text-xs font-bold">Cargando actividad...</span>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50 py-8">
                        <MessageSquare className="w-8 h-8" />
                        <span className="text-xs font-bold">No hay comentarios aún</span>
                        <span className="text-[10px]">Sé el primero en escribir algo</span>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {comment.user?.full_name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">
                                        {comment.user?.full_name || 'Usuario'}
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Escribe un comentario o actualización..."
                        className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-primary transition-colors"
                        disabled={sending}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !newComment.trim()}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
