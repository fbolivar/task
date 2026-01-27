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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('PEGA_AQUÍ')) {
            const reason = !supabaseUrl ? 'falta NEXT_PUBLIC_SUPABASE_URL' :
                (!supabaseServiceKey ? 'falta SUPABASE_SERVICE_ROLE_KEY' : 'la llave SUPABASE_SERVICE_ROLE_KEY es inválida (contiene texto de instrucción)');

            console.error(`Configuración de Supabase inválida: ${reason}`);

            const isLocal = process.env.NODE_ENV === 'development';
            const locationHint = isLocal ? 'en .env.local' : 'en las variables de entorno de tu proveedor de hosting (Vercel)';
            const restartHint = isLocal ? ' Reinicia el servidor tras corregirlo.' : ' Asegúrate de desplegar de nuevo tras guardar los cambios.';

            return NextResponse.json({
                error: `Configuración incompleta: ${reason}. Asegúrate de que el valor ${locationHint} sea CORRECTO.${restartHint}`
            }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Create User in Auth
        const tempPassword = password || Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        let userId: string;

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name }
        });

        if (createError) {
            if (createError.message.includes('already been registered')) {
                // User exists in Auth, but maybe not in Profiles. 
                // We need to find the ID to "repair" the setup.
                console.log(`User ${email} already registered, looking up ID...`);
                // Note: listUsers is the only way as admin to find by email if not in public tables
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users?.find(u => u.email === email);

                if (existingUser) {
                    userId = existingUser.id;
                    console.log(`Found existing ID: ${userId}. Proceeding with idempotent setup.`);
                } else {
                    return NextResponse.json({ error: 'El usuario ya existe pero no se pudo localizar su ID de sistema.' }, { status: 400 });
                }
            } else {
                console.error('Create User Error:', createError);
                return NextResponse.json({ error: createError.message }, { status: 400 });
            }
        } else {
            if (!newUser.user) {
                return NextResponse.json({ error: 'User creation failed unexpectedly' }, { status: 500 });
            }
            userId = newUser.user.id;
        }

        // 5. Ensure Profile exists and is updated (Role, etc)
        // We use upsert to avoid race conditions with the database trigger
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                full_name,
                role_id,
                has_all_entities_access,
                is_active: is_active ?? true,
                must_change_password: true,
                email: email // Keep email in sync
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile Upsert Error:', profileError);
            // This is critical because entities and notifications depend on the profile
            return NextResponse.json({ error: `Error actualizando perfil: ${profileError.message}` }, { status: 500 });
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

            if (entityError) {
                console.error('Entity Assign Error:', entityError);
                return NextResponse.json({ error: `Error asignando entidades: ${entityError.message}` }, { status: 500 });
            }
        }

        // 7. Prepare Role Name for email
        const { data: roleData, error: roleError } = await supabaseAdmin.from('roles').select('name').eq('id', role_id).single();
        if (roleError) {
            console.warn('Could not fetch role name:', roleError);
        }
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

                // 8. Fetch and Prepare Email Template
                const { data: template } = await supabaseAdmin
                    .from('email_templates')
                    .select('*')
                    .eq('code', 'welcome_user')
                    .eq('is_active', true)
                    .single();

                // App Settings
                const { data: settings } = await supabaseAdmin.from('app_settings').select('app_name, header_color').single();
                const appName = settings?.app_name || 'GestorPro';

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://task-eosin-nu.vercel.app';
                const entityListStr = entityNames.join(', ');

                let subject = `Bienvenido a ${appName} - Tus credenciales de acceso`;
                let html = '';

                if (template) {
                    subject = template.subject || subject;
                    html = template.body_html || '';

                    const vars: Record<string, string> = {
                        name: full_name,
                        email: email,
                        password: tempPassword,
                        role: assignedRoleName,
                        entities: entityListStr,
                        app_name: appName,
                        app_url: appUrl
                    };

                    Object.entries(vars).forEach(([key, value]) => {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        subject = subject.replace(regex, value);
                        html = html.replace(regex, value);
                    });
                } else {
                    // Fallback to minimal text if template missing
                    html = `Hola ${full_name}, tus credenciales son: Email: ${email}, Password: ${tempPassword}`;
                }

                const transporter = nodemailer.createTransport({
                    host: smtp_host || 'smtp.gmail.com',
                    port: smtp_port || 587,
                    secure: false,
                    auth: { user: smtpEmail, pass: app_password }
                });

                const mailOptions = {
                    from: `"${appName}" <${smtpEmail}>`,
                    to: email,
                    subject: subject,
                    html: html
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
