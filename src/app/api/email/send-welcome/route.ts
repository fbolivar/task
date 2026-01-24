import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

interface WelcomeEmailRequest {
    to: string;
    userName: string;
    roleName: string;
    entityNames: string[];
    tempPassword: string;
}

export async function POST(request: Request) {
    try {
        const body: WelcomeEmailRequest = await request.json();
        const { to, userName, roleName, entityNames, tempPassword } = body;

        if (!to || !userName || !tempPassword) {
            return NextResponse.json(
                { error: 'Faltan campos requeridos (to, userName, tempPassword)' },
                { status: 400 }
            );
        }

        // Get SMTP configuration from integrations table
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: integration, error: integrationError } = await supabase
            .from('integrations')
            .select('config, is_active')
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single();

        if (integrationError || !integration) {
            console.error('Integration Error:', integrationError);
            return NextResponse.json(
                { error: 'No hay integración de Gmail activa configurada' },
                { status: 400 }
            );
        }

        const { email, app_password, smtp_host, smtp_port } = integration.config;

        if (!email || !app_password) {
            return NextResponse.json(
                { error: 'Configuración de Gmail incompleta' },
                { status: 400 }
            );
        }

        // Get app settings for branding
        const { data: settings } = await supabase
            .from('app_settings')
            .select('app_name, header_color')
            .single();

        const appName = settings?.app_name || 'GestorPro';
        const headerColor = settings?.header_color || '#2563EB';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://task-eosin-nu.vercel.app';

        // Configure transporter
        const transporter = nodemailer.createTransport({
            host: smtp_host || 'smtp.gmail.com',
            port: smtp_port || 587,
            secure: false,
            auth: {
                user: email,
                pass: app_password,
            },
        });

        // Build entity list
        const entityList = entityNames.length > 0
            ? entityNames.join(', ')
            : 'Todas las entidades';

        const mailOptions = {
            from: `"${appName}" <${email}>`,
            to: to,
            subject: `Bienvenido a ${appName} - Tus credenciales de acceso`,
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td align="center" style="padding: 40px 20px;">
                                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); padding: 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800;">¡Bienvenido a ${appName}!</h1>
                                            <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Tu cuenta ha sido creada exitosamente</p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                                Hola <strong>${userName}</strong>,
                                            </p>
                                            <p style="margin: 0 0 30px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                                Se ha creado una cuenta para ti en nuestra plataforma. A continuación encontrarás tus credenciales de acceso:
                                            </p>
                                            
                                            <!-- Credentials Box -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 12px; margin-bottom: 30px;">
                                                <tr>
                                                    <td style="padding: 24px;">
                                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                            <tr>
                                                                <td style="padding: 8px 0;">
                                                                    <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</span>
                                                                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">${to}</p>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                                                    <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Contraseña Temporal</span>
                                                                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600; font-family: monospace; background: #fef3c7; padding: 8px 12px; border-radius: 6px; display: inline-block;">${tempPassword}</p>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                                                    <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Rol</span>
                                                                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">${roleName || 'Sin rol asignado'}</p>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">
                                                                    <span style="color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Entidad(es)</span>
                                                                    <p style="margin: 4px 0 0; color: #111827; font-size: 15px; font-weight: 600;">${entityList}</p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- Warning -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 30px;">
                                                <tr>
                                                    <td style="padding: 16px 20px;">
                                                            <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600;">⚠️ Importante</p>
                                                        <p style="margin: 8px 0 0; color: #7f1d1d; font-size: 13px; line-height: 1.5;">
                                                            Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                            
                                            <!-- CTA Button -->
                                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${appUrl}/login" style="display: inline-block; background: ${headerColor}; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                                            Iniciar Sesión
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Footer -->
                                    <tr>
                                        <td style="background: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                                Este correo fue enviado automáticamente por ${appName}.<br>
                                                Si no solicitaste esta cuenta, ignora este mensaje.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({
            success: true,
            messageId: info.messageId
        });

    } catch (error: any) {
        console.error('Error sending welcome email:', error);
        return NextResponse.json(
            { error: error.message || 'Error al enviar el correo de bienvenida' },
            { status: 500 }
        );
    }
}
