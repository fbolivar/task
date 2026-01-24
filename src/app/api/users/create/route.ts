import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        // 1. Verify Authentication & Permissions
        const supabaseAuth = await createServerClient();
        const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();

        if (authError || !caller) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if caller is Admin
        const { data: callerProfile } = await supabaseAuth
            .from('profiles')
            .select('role:roles(name)')
            .eq('id', caller.id)
            .single();

        const roleName = (callerProfile?.role as any)?.name;
        if (roleName !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { full_name, email, role_id, entity_ids, has_all_entities_access, is_active, password } = body;

        if (!email || !full_name || !role_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Initialize Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 4. Create User in Auth
        const tempPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (createError) {
            console.error('Create User Error:', createError);
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        if (!newUser.user) {
            return NextResponse.json({ error: 'User creation failed unexpectedly' }, { status: 500 });
        }

        const userId = newUser.user.id;

        // 5. Update Profile (Role, etc)
        // Trigger might have created profile, but we overwrite to be sure/fast
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name,
                role_id,
                has_all_entities_access,
                is_active: is_active ?? true,
                must_change_password: true
            })
            .eq('id', userId);

        if (profileError) {
            // If trigger failed or hasn't run, we might need to insert? 
            // Normally trigger runs ON INSERT. 
            // Try Update first. If user not found (trigger lag?), wait? 
            // Actually, admin.createUser inserts into auth.users -> Trigger -> public.profiles.
            // We can retry update if it fails?
            console.error('Profile Update Error:', profileError);
            // We continue, but warn?
        }

        // 6. Assign Entities
        if (!has_all_entities_access && entity_ids && entity_ids.length > 0) {
            const entityInserts = entity_ids.map((eid: string) => ({
                profile_id: userId,
                entity_id: eid
            }));
            const { error: entityError } = await supabaseAdmin
                .from('profile_entities')
                .insert(entityInserts);

            if (entityError) console.error('Entity Assign Error:', entityError);
        }

        // 7. Prepare Email Data
        // Fetch Role Name for email
        const { data: roleData } = await supabaseAdmin.from('roles').select('name').eq('id', role_id).single();
        const assignedRoleName = roleData?.name || 'Usuario';

        // Fetch Entity Names
        let entityNames: string[] = [];
        if (has_all_entities_access) {
            entityNames = ['Todas las entidades'];
        } else if (entity_ids && entity_ids.length > 0) {
            const { data: entities } = await supabaseAdmin.from('entities').select('name').in('id', entity_ids);
            if (entities) entityNames = entities.map(e => e.name);
        }

        // 8. Send Welcome Email
        // (Logic copied from send-welcome, with FIXED URL)

        // Get SMTP config
        const { data: integration } = await supabaseAdmin
            .from('integrations')
            .select('config, is_active')
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single();

        let emailSent = false;
        let emailError = null;

        if (integration && integration.config) {
            try {
                const { email: smtpEmail, app_password, smtp_host, smtp_port } = integration.config;

                // App Settings
                const { data: settings } = await supabaseAdmin.from('app_settings').select('app_name, header_color').single();
                const appName = settings?.app_name || 'GestorPro';
                const headerColor = settings?.header_color || '#2563EB';

                // HARDCODED URL FIX
                const appUrl = 'https://task-eosin-nu.vercel.app';

                const transporter = nodemailer.createTransport({
                    host: smtp_host || 'smtp.gmail.com',
                    port: smtp_port || 587,
                    secure: false,
                    auth: { user: smtpEmail, pass: app_password }
                });

                const entityListStr = entityNames.join(', ');

                const mailOptions = {
                    from: `"${appName}" <${smtpEmail}>`,
                    to: email,
                    subject: `Bienvenido a ${appName} - Tus credenciales de acceso`,
                    html: `
                        <!DOCTYPE html>
                        <html lang="es">
                        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f4f5;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 40px 20px;">
                                        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, ${headerColor}, ${headerColor}dd); padding: 40px 30px; text-align: center;">
                                                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 800;">¡Bienvenido a ${appName}!</h1>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <p>Hola <strong>${full_name}</strong>,</p>
                                                    <p>Credenciales de acceso:</p>
                                                    <table style="width: 100%; background: #f9fafb; border-radius: 12px; margin-bottom: 20px; padding: 15px;">
                                                        <tr><td><strong>Email:</strong> ${email}</td></tr>
                                                        <tr><td><strong>Contraseña:</strong> <code style="background: #e5e7eb; padding: 4px; border-radius: 4px;">${tempPassword}</code></td></tr>
                                                        <tr><td><strong>Rol:</strong> ${assignedRoleName}</td></tr>
                                                        <tr><td><strong>Entidades:</strong> ${entityListStr}</td></tr>
                                                    </table>
                                                    
                                                    <div style="background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                                        <strong>⚠️ Importante:</strong> Por seguridad, deberás cambiar tu contraseña en el primer inicio de sesión.
                                                    </div>

                                                    <div style="text-align: center;">
                                                        <a href="${appUrl}/login" style="display: inline-block; background: ${headerColor}; color: white; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                                                            INICIAR SESIÓN
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `
                };

                await transporter.sendMail(mailOptions);
                emailSent = true;
            } catch (e: any) {
                console.error('Email Send Error:', e);
                emailError = e.message;
            }
        } else {
            emailError = 'No SMTP integration configured';
        }

        return NextResponse.json({
            success: true,
            userId,
            emailSent,
            emailError
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
