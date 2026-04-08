import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getLoginUrl } from '@/shared/utils/appUrl';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { userId, newPassword } = await request.json();

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        // 1. Verify Requestor is Admin
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role:roles(name)')
            .eq('id', user.id)
            .single();

        const roleName = (profile?.role as any)?.name;

        if (roleName !== 'Admin') {
            return NextResponse.json({ error: 'Acceso denegado: Se requieren permisos de Administrador' }, { status: 403 });
        }

        // 2. Perform Update using Admin Client
        const supabaseAdmin = await createAdminClient();
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) throw error;

        // 3. Get target user info for email
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('id', userId)
            .single();

        const targetEmail = targetProfile?.email;
        const targetName = targetProfile?.full_name || 'Usuario';

        // 4. Send notification email with new password
        let emailSent = false;
        let emailError = null;

        if (targetEmail) {
            try {
                const { data: integration } = await supabaseAdmin
                    .from('integrations')
                    .select('config, is_active')
                    .eq('provider', 'gmail')
                    .eq('is_active', true)
                    .single();

                if (integration && integration.config) {
                    const { email: smtpEmail, app_password, smtp_host, smtp_port } = integration.config as any;

                    // Try to use email template
                    const { data: template } = await supabaseAdmin
                        .from('email_templates')
                        .select('*')
                        .eq('code', 'password_changed')
                        .eq('is_active', true)
                        .single();

                    const { data: settings } = await supabaseAdmin
                        .from('app_settings')
                        .select('app_name')
                        .single();

                    const appName = settings?.app_name || 'GestorPro';
                    const appUrl = getLoginUrl();

                    let subject = `${appName} - Tu contraseña ha sido actualizada`;
                    let html = '';

                    if (template) {
                        subject = template.subject || subject;
                        html = template.body_html || '';

                        const vars: Record<string, string> = {
                            name: targetName,
                            email: targetEmail,
                            password: newPassword,
                            app_name: appName,
                            app_url: appUrl,
                        };

                        Object.entries(vars).forEach(([key, value]) => {
                            const regex = new RegExp(`{{${key}}}`, 'g');
                            subject = subject.replace(regex, value);
                            html = html.replace(regex, value);
                        });
                    } else {
                        // Fallback HTML email
                        html = `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: #1e293b; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                                    <h1 style="margin: 0; font-size: 22px;">${appName}</h1>
                                    <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Actualización de Contraseña</p>
                                </div>
                                <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
                                    <p style="margin: 0 0 16px;">Hola <strong>${targetName}</strong>,</p>
                                    <p style="margin: 0 0 16px;">Tu contraseña ha sido actualizada por un administrador. A continuación encontrarás tus nuevas credenciales de acceso:</p>
                                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Email:</strong> ${targetEmail}</p>
                                        <p style="margin: 0; font-size: 14px;"><strong>Nueva Contraseña:</strong> ${newPassword}</p>
                                    </div>
                                    <p style="margin: 16px 0; font-size: 13px; color: #64748b;">Por seguridad, te recomendamos cambiar esta contraseña después de iniciar sesión.</p>
                                    <div style="text-align: center; margin-top: 24px;">
                                        <a href="${appUrl}" style="background: #f59e0b; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Iniciar Sesión</a>
                                    </div>
                                </div>
                                <div style="text-align: center; padding: 16px; font-size: 12px; color: #94a3b8;">
                                    <p style="margin: 0;">Este correo fue enviado automáticamente por ${appName}.</p>
                                </div>
                            </div>
                        `;
                    }

                    const transporter = nodemailer.createTransport({
                        host: smtp_host || 'smtp.gmail.com',
                        port: Number(smtp_port) || 587,
                        secure: false,
                        auth: { user: smtpEmail, pass: app_password },
                    });

                    await transporter.sendMail({
                        from: `"${appName}" <${smtpEmail}>`,
                        to: targetEmail,
                        subject,
                        html,
                    });

                    emailSent = true;
                } else {
                    emailError = 'No hay integración SMTP configurada';
                }
            } catch (e: any) {
                console.error('Error sending password change email:', e);
                emailError = e.message;
            }
        } else {
            emailError = 'El usuario no tiene email registrado';
        }

        return NextResponse.json({
            success: true,
            message: 'Contraseña actualizada correctamente',
            emailSent,
            emailError,
        });

    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
