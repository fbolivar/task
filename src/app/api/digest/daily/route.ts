import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/shared/utils/appUrl'

const today = () => new Date().toISOString().split('T')[0]
const addDays = (days: number) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function buildHtml(name: string, tasks: { overdue: Task[]; dueToday: Task[]; dueThisWeek: Task[]; future: Task[] }): string {
  const total = tasks.overdue.length + tasks.dueToday.length + tasks.dueThisWeek.length + tasks.future.length
  const appUrl = getAppUrl()

  const taskRow = (title: string, extra?: string) =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:14px;">${title}${extra ? `<span style="color:#94a3b8;font-size:12px;margin-left:8px;">${extra}</span>` : ''}</td></tr>`

  const section = (color: string, label: string, items: Task[], getExtra?: (t: Task) => string) =>
    items.length === 0 ? '' : `
    <div style="margin-bottom:20px;">
      <div style="background:${color};color:white;padding:8px 14px;border-radius:6px 6px 0 0;font-weight:bold;font-size:13px;">${label} (${items.length})</div>
      <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 6px 6px;padding:0 14px;">
        <tbody>${items.map(t => taskRow(t.title, getExtra?.(t))).join('')}</tbody>
      </table>
    </div>`

  const daysOverdue = (t: Task) => {
    if (!t.end_date) return ''
    const diff = Math.floor((new Date(today()).getTime() - new Date(t.end_date).getTime()) / 86400000)
    return diff === 1 ? '1 día vencida' : `${diff} días vencida`
  }

  const dayLabel = (t: Task) => {
    if (!t.end_date) return ''
    return new Date(t.end_date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
  }

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#1e293b;color:white;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">GestorPro</h1>
    <p style="margin:8px 0 0;opacity:0.7;font-size:13px;">Resumen diario de tareas</p>
  </div>
  <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;">
    <p style="margin:0 0 6px;font-size:16px;">Hola <strong>${name}</strong>,</p>
    <p style="margin:0 0 20px;color:#475569;font-size:14px;">Tienes <strong>${total}</strong> tarea${total !== 1 ? 's' : ''} pendiente${total !== 1 ? 's' : ''} para hoy.</p>
    ${section('#dc2626', 'Tareas vencidas', tasks.overdue, daysOverdue)}
    ${section('#ea580c', 'Para hoy', tasks.dueToday)}
    ${section('#2563eb', 'Esta semana', tasks.dueThisWeek, dayLabel)}
    ${tasks.future.length > 0 ? `<p style="color:#64748b;font-size:13px;margin:0;">Y ${tasks.future.length} tarea${tasks.future.length !== 1 ? 's' : ''} más en el futuro.</p>` : ''}
  </div>
  <div style="background:#1e293b;border-radius:0 0 12px 12px;padding:20px;text-align:center;">
    <a href="${appUrl}" style="background:#f59e0b;color:white;padding:10px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Ver mis tareas en GestorPro</a>
  </div>
</div>`
}

interface Task { title: string; end_date: string | null }
interface Profile { id: string; full_name: string; email: string }

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const todayStr = today()
  const endOfWeek = addDays(7)

  const { data: integration } = await supabase
    .from('integrations')
    .select('config')
    .eq('provider', 'gmail')
    .eq('is_active', true)
    .single()

  if (!integration?.config) {
    return NextResponse.json({ error: 'No SMTP config found' }, { status: 500 })
  }

  const { email: smtpEmail, app_password, smtp_host, smtp_port } = integration.config as Record<string, string>
  const transporter = nodemailer.createTransport({
    host: smtp_host || 'smtp.gmail.com',
    port: Number(smtp_port) || 587,
    secure: false,
    auth: { user: smtpEmail, pass: app_password },
  })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)

  let sent = 0, skipped = 0, errors = 0

  for (const profile of (profiles as Profile[] ?? [])) {
    if (!profile.email) { skipped++; continue }

    const { data: rawTasks } = await supabase
      .from('tasks')
      .select('title, end_date')
      .eq('assigned_to', profile.id)
      .neq('status', 'Completado')
      .or('archived.is.null,archived.eq.false')

    const allTasks = (rawTasks as Task[] ?? [])
    if (allTasks.length === 0) { skipped++; continue }

    const overdue = allTasks.filter(t => t.end_date && t.end_date < todayStr)
    const dueToday = allTasks.filter(t => t.end_date === todayStr)
    const dueThisWeek = allTasks.filter(t => t.end_date && t.end_date > todayStr && t.end_date <= endOfWeek)
    const future = allTasks.filter(t => !t.end_date || t.end_date > endOfWeek)

    try {
      await transporter.sendMail({
        from: `"GestorPro" <${smtpEmail}>`,
        to: profile.email,
        subject: `Tu resumen de tareas - ${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`,
        html: buildHtml(profile.full_name || 'Usuario', { overdue, dueToday, dueThisWeek, future }),
      })
      sent++
    } catch (e) {
      console.error(`Digest email error for ${profile.email}:`, e)
      errors++
    }
  }

  return NextResponse.json({ sent, skipped, errors })
}
