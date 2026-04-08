'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { TaskComment } from '../types';
import { commentService } from '../services/commentService';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { createClient } from '@/lib/supabase/client';

interface CommentsSectionProps {
    taskId: string;
}

interface MentionUser {
    id: string;
    full_name: string;
}

function renderWithMentions(text: string) {
    const parts = text.split(/(@[\w\s]+?)(?=\s@|\s*$|[^a-zA-Z\s])/g);
    return parts.map((part, i) =>
        part.startsWith('@') ? (
            <span key={i} className="text-primary font-semibold dark:text-emerald-400">
                {part}
            </span>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

export function CommentsSection({ taskId }: CommentsSectionProps) {
    const { t } = useSettings();
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Mention state
    const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredUsers = mentionQuery !== null
        ? allUsers.filter((u) =>
              u.full_name.toLowerCase().includes(mentionQuery.toLowerCase())
          ).slice(0, 5)
        : [];

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
        if (taskId) fetchComments();
    }, [taskId]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    // Lazy-load users the first time '@' is typed
    const loadUsers = useCallback(async () => {
        if (allUsers.length > 0) return;
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('is_active', true)
                .order('full_name');
            if (data) setAllUsers(data as MentionUser[]);
        } catch {
            // non-critical
        }
    }, [allUsers.length]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Detect active @mention: find the last '@' before cursor
        const cursor = e.target.selectionStart ?? value.length;
        const textUpToCursor = value.slice(0, cursor);
        const atIndex = textUpToCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const query = textUpToCursor.slice(atIndex + 1);
            // Only trigger if no space before the last word after @
            if (!query.includes(' ') || query.length === 0) {
                setMentionQuery(query);
                setMentionIndex(0);
                loadUsers();
                return;
            }
        }
        setMentionQuery(null);
    };

    const selectMention = (user: MentionUser) => {
        if (!inputRef.current) return;
        const cursor = inputRef.current.selectionStart ?? newComment.length;
        const textUpToCursor = newComment.slice(0, cursor);
        const atIndex = textUpToCursor.lastIndexOf('@');
        const before = newComment.slice(0, atIndex);
        const after = newComment.slice(cursor);
        const inserted = `@${user.full_name} `;
        setNewComment(before + inserted + after);
        setMentionQuery(null);
        // Re-focus input after selection
        setTimeout(() => {
            if (inputRef.current) {
                const pos = before.length + inserted.length;
                inputRef.current.focus();
                inputRef.current.setSelectionRange(pos, pos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionQuery !== null && filteredUsers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((i) => (i + 1) % filteredUsers.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((i) => (i - 1 + filteredUsers.length) % filteredUsers.length);
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                selectMention(filteredUsers[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setMentionQuery(null);
                return;
            }
        }
        if (e.key === 'Enter' && mentionQuery === null) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            setSending(true);
            const comment = await commentService.addComment(taskId, newComment);
            setComments((prev) => [...prev, comment]);
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
                        <span className="text-xs font-bold">No hay comentarios aun</span>
                        <span className="text-[10px]">Se el primero en escribir algo</span>
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
                                    {renderWithMentions(comment.content)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={commentsEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-xl">
                {/* Mention dropdown (above input) */}
                {mentionQuery !== null && filteredUsers.length > 0 && (
                    <div className="mb-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                        {filteredUsers.map((user, idx) => (
                            <button
                                key={user.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); selectMention(user); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                    idx === mentionIndex
                                        ? 'bg-primary/10 text-primary dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-foreground'
                                }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary dark:text-emerald-400 font-bold text-xs flex-shrink-0">
                                    {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium truncate">{user.full_name}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escribe un comentario o usa @ para mencionar..."
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
