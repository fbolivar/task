'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Video,
    ChevronDown,
    ChevronUp,
    X,
    Loader2,
    Users,
    Clock,
    Calendar,
    ExternalLink,
    Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/shared/components/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleMeetingProps {
    entityType: 'task' | 'project' | 'general';
    entityId?: string;
    entityTitle?: string;
}

interface UserOption {
    id: string;
    full_name: string;
    email: string;
}

interface Meeting {
    id: string;
    title: string;
    description: string | null;
    meeting_date: string;
    duration_minutes: number;
    meet_link: string | null;
    entity_type: string;
    entity_id: string | null;
    created_by: string;
    created_at: string;
    participant_count?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTomorrowAt10(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    // Format as local datetime-local value: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMeetingDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScheduleMeeting({ entityType, entityId, entityTitle }: ScheduleMeetingProps) {
    const { user } = useAuthStore();
    const { toast } = useToast();

    const [expanded, setExpanded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingMeetings, setLoadingMeetings] = useState(false);

    // Form state
    const [title, setTitle] = useState(entityTitle ? `Seguimiento: ${entityTitle}` : '');
    const [meetingDatetime, setMeetingDatetime] = useState(getTomorrowAt10());
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

    // Data
    const [allUsers, setAllUsers] = useState<UserOption[]>([]);
    const [meetings, setMeetings] = useState<Meeting[]>([]);

    // ---------------------------------------------------------------------------
    // Fetch active users
    // ---------------------------------------------------------------------------

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('is_active', true)
                .order('full_name');
            if (data) setAllUsers(data as UserOption[]);
        } finally {
            setLoadingUsers(false);
        }
    }, []);

    // ---------------------------------------------------------------------------
    // Fetch meetings for this entity
    // ---------------------------------------------------------------------------

    const fetchMeetings = useCallback(async () => {
        if (!entityId) return;
        setLoadingMeetings(true);
        try {
            const supabase = createClient();
            const now = new Date().toISOString();

            const { data: meetingData } = await supabase
                .from('meetings')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .gte('meeting_date', now)
                .order('meeting_date', { ascending: true });

            if (!meetingData) {
                setMeetings([]);
                return;
            }

            // Get participant counts
            const meetingIds = meetingData.map((m: Meeting) => m.id);
            const { data: participantData } = await supabase
                .from('meeting_participants')
                .select('meeting_id')
                .in('meeting_id', meetingIds);

            const countMap: Record<string, number> = {};
            (participantData ?? []).forEach((p: { meeting_id: string }) => {
                countMap[p.meeting_id] = (countMap[p.meeting_id] ?? 0) + 1;
            });

            const enriched = meetingData.map((m: Meeting) => ({
                ...m,
                participant_count: countMap[m.id] ?? 0,
            }));

            setMeetings(enriched);
        } finally {
            setLoadingMeetings(false);
        }
    }, [entityId, entityType]);

    // ---------------------------------------------------------------------------
    // Effects
    // ---------------------------------------------------------------------------

    useEffect(() => {
        if (expanded && allUsers.length === 0) {
            fetchUsers();
        }
    }, [expanded, allUsers.length, fetchUsers]);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    // Reset title when entityTitle changes
    useEffect(() => {
        if (!expanded) {
            setTitle(entityTitle ? `Seguimiento: ${entityTitle}` : '');
        }
    }, [entityTitle, expanded]);

    // ---------------------------------------------------------------------------
    // Toggle participant selection
    // ---------------------------------------------------------------------------

    const toggleParticipant = (userId: string) => {
        setSelectedParticipants((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    // ---------------------------------------------------------------------------
    // Save meeting
    // ---------------------------------------------------------------------------

    const handleSave = async () => {
        if (!title.trim()) {
            toast('El titulo de la reunion es requerido', 'error');
            return;
        }
        if (!meetingDatetime) {
            toast('La fecha y hora son requeridas', 'error');
            return;
        }
        if (!user) {
            toast('Debes iniciar sesion para agendar reuniones', 'error');
            return;
        }

        setSaving(true);
        try {
            const supabase = createClient();

            // Convert local datetime to ISO
            const meetingDate = new Date(meetingDatetime).toISOString();
            const meetLink = 'https://meet.google.com/new';

            // Insert meeting
            const { data: newMeeting, error: meetingError } = await supabase
                .from('meetings')
                .insert({
                    title: title.trim(),
                    meeting_date: meetingDate,
                    duration_minutes: durationMinutes,
                    meet_link: meetLink,
                    entity_type: entityType,
                    entity_id: entityId ?? null,
                    created_by: user.id,
                })
                .select('id')
                .single();

            if (meetingError || !newMeeting) {
                throw new Error(meetingError?.message ?? 'Error al crear la reunion');
            }

            // Insert participants (deduplicated, skip duplicates silently)
            if (selectedParticipants.length > 0) {
                const participantRows = selectedParticipants.map((uid) => ({
                    meeting_id: newMeeting.id,
                    user_id: uid,
                }));
                await supabase.from('meeting_participants').insert(participantRows);
            }

            // Send email notifications to participants
            if (selectedParticipants.length > 0) {
                const participantUsers = allUsers.filter((u) =>
                    selectedParticipants.includes(u.id) && u.email
                );
                const formattedDate = formatMeetingDate(meetingDate);
                const durationLabel =
                    durationMinutes >= 60
                        ? `${durationMinutes / 60}h`
                        : `${durationMinutes} min`;

                const emailPromises = participantUsers.map((participant) =>
                    fetch('/api/notifications/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: participant.email,
                            subject: `Reunion agendada: ${title.trim()}`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                                    <h2 style="color: #0d9488;">Reunion agendada</h2>
                                    <p>Hola <strong>${participant.full_name}</strong>,</p>
                                    <p>Se ha agendado una reunion a la que fuiste invitado/a:</p>
                                    <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
                                        <tr>
                                            <td style="padding: 8px; font-weight: bold; color: #555;">Titulo</td>
                                            <td style="padding: 8px;">${title.trim()}</td>
                                        </tr>
                                        <tr style="background: #f9fafb;">
                                            <td style="padding: 8px; font-weight: bold; color: #555;">Fecha y hora</td>
                                            <td style="padding: 8px;">${formattedDate}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px; font-weight: bold; color: #555;">Duracion</td>
                                            <td style="padding: 8px;">${durationLabel}</td>
                                        </tr>
                                    </table>
                                    <p>
                                        <a href="${meetLink}" style="display: inline-block; background: #0d9488; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                            Unirse a Google Meet
                                        </a>
                                    </p>
                                    <p style="color: #999; font-size: 12px;">Este mensaje fue generado automaticamente.</p>
                                </div>
                            `,
                        }),
                    }).catch(() => null) // silent fail per participant
                );

                await Promise.allSettled(emailPromises);
            }

            toast('Reunion agendada exitosamente', 'success');
            setExpanded(false);
            // Reset form
            setTitle(entityTitle ? `Seguimiento: ${entityTitle}` : '');
            setMeetingDatetime(getTomorrowAt10());
            setDurationMinutes(30);
            setSelectedParticipants([]);
            // Refresh meetings list
            await fetchMeetings();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al agendar la reunion';
            toast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ---------------------------------------------------------------------------
    // Delete meeting
    // ---------------------------------------------------------------------------

    const handleDelete = async (meetingId: string) => {
        if (!user) return;
        try {
            const supabase = createClient();
            await supabase.from('meeting_participants').delete().eq('meeting_id', meetingId);
            const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
            if (error) throw error;
            toast('Reunion eliminada', 'success');
            await fetchMeetings();
        } catch {
            toast('No se pudo eliminar la reunion', 'error');
        }
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <section aria-label="Reuniones de seguimiento" className="space-y-3">
            {/* Toggle button */}
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 text-sm font-bold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                aria-expanded={expanded}
            >
                <Video className="w-4 h-4" />
                Agendar Seguimiento
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Inline form */}
            {expanded && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            Nueva reunion de seguimiento
                        </h3>
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            aria-label="Cerrar formulario"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Titulo
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-teal-500 transition-all text-sm font-medium"
                            placeholder="Titulo de la reunion..."
                        />
                    </div>

                    {/* Date + Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Fecha y hora
                            </label>
                            <input
                                type="datetime-local"
                                value={meetingDatetime}
                                onChange={(e) => setMeetingDatetime(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-teal-500 transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Duracion
                            </label>
                            <select
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-teal-500 transition-all text-sm font-medium appearance-none"
                            >
                                <option value={15}>15 minutos</option>
                                <option value={30}>30 minutos</option>
                                <option value={45}>45 minutos</option>
                                <option value={60}>1 hora</option>
                            </select>
                        </div>
                    </div>

                    {/* Meet link info */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900">
                        <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                            Se generara automaticamente un enlace de Google Meet al guardar.
                        </span>
                    </div>

                    {/* Participants */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Participantes
                            {selectedParticipants.length > 0 && (
                                <span className="ml-1 bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-full text-[9px] font-black">
                                    {selectedParticipants.length}
                                </span>
                            )}
                        </label>
                        {loadingUsers ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Cargando usuarios...
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                                {allUsers.map((u) => {
                                    const selected = selectedParticipants.includes(u.id);
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => toggleParticipant(u.id)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                                                selected
                                                    ? 'bg-teal-100 dark:bg-teal-900/50 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-300'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-teal-300 dark:hover:border-teal-700'
                                            }`}
                                            aria-pressed={selected}
                                        >
                                            {selected && <span aria-hidden="true">✓</span>}
                                            {u.full_name}
                                        </button>
                                    );
                                })}
                                {allUsers.length === 0 && (
                                    <p className="text-xs text-muted-foreground">No hay usuarios disponibles.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setExpanded(false)}
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Video className="w-4 h-4" />
                                    Agendar reunion
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Upcoming meetings list */}
            {entityId && (
                <div className="space-y-2">
                    {loadingMeetings ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Cargando reuniones...
                        </div>
                    ) : meetings.length > 0 ? (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Proximas reuniones ({meetings.length})
                            </p>
                            <ul className="space-y-2" role="list">
                                {meetings.map((meeting) => (
                                    <li
                                        key={meeting.id}
                                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 flex flex-col gap-2"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">
                                                    {meeting.title}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatMeetingDate(meeting.meeting_date)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        {meeting.duration_minutes >= 60
                                                            ? `${meeting.duration_minutes / 60}h`
                                                            : `${meeting.duration_minutes}min`}
                                                    </span>
                                                    {(meeting.participant_count ?? 0) > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Users className="w-3 h-3" />
                                                            {meeting.participant_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Delete (creator only) */}
                                            {user && meeting.created_by === user.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(meeting.id)}
                                                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                    aria-label="Eliminar reunion"
                                                    title="Eliminar reunion"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                        {/* Join button */}
                                        {meeting.meet_link && (
                                            <a
                                                href={meeting.meet_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors w-full sm:w-auto"
                                                aria-label={`Unirse a la reunion ${meeting.title}`}
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                Unirse a Meet
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : null}
                </div>
            )}
        </section>
    );
}
