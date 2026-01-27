import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    console.log('--- EMAIL NOTIFICATION REQUEST START ---');
    try {
        const requestBody = await request.json();
        let { to, subject, html, template_code, variables, attachments } = requestBody;
        console.log('Request payload:', { to, subject, template_code, variables });

        // 1. Get Supabase Client
        const supabase = await createClient();

        // 2. If template_code provided, override subject and html
        if (template_code) {
            console.log(`Searching for template: ${template_code}`);
            const { data: template, error: tError } = await supabase
                .from('email_templates')
                .select('*')
                .eq('code', template_code)
                .eq('is_active', true)
                .single();

            if (tError || !template) {
                console.warn(`Template ${template_code} not found or inactive:`, tError);
            } else {
                console.log('Template found:', template.name);
                subject = template.subject || subject;
                html = template.body_html || html;

                // Replace variables
                if (variables) {
                    console.log('Replacing variables in template...');
                    Object.entries(variables).forEach(([key, value]) => {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        subject = subject.replace(regex, String(value));
                        html = html.replace(regex, String(value));
                    });
                }
            }
        }

        if (!html) {
            console.error('No email content (html) provided or resolved');
            return NextResponse.json({ error: 'No content to send' }, { status: 400 });
        }

        // 3. Get Integration Config (Use Admin Client to bypass RLS on integrations)
        console.log('Fetching gmail integration...');
        const adminSupabase = await createAdminClient();
        const { data: integration, error } = await adminSupabase
            .from('integrations')
            .select('config')
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single();

        if (error || !integration) {
            console.error('No active email integration found:', error);
            return NextResponse.json({ error: 'No active email configuration found' }, { status: 404 });
        }

        const config = integration.config as any;
        console.log('Integrations found for:', config.email);

        if (!config.email || !config.app_password) {
            console.error('Incomplete integration config (missing email or password)');
            return NextResponse.json({ error: 'Invalid email configuration' }, { status: 500 });
        }

        // 4. Create Transporter
        console.log('Creating nodemailer transporter...');
        const transporter = nodemailer.createTransport({
            host: config.smtp_host || 'smtp.gmail.com',
            port: config.smtp_port || 587,
            secure: false,
            auth: {
                user: config.email,
                pass: config.app_password,
            },
        });

        // 5. Send Email
        console.log(`Sending email to ${to}...`);
        const info = await transporter.sendMail({
            from: `"GestorPro System" <${config.email}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: Array.isArray(requestBody.attachments) ? requestBody.attachments : []
        });

        console.log('Email sent successfully:', info.messageId);
        console.log('--- EMAIL NOTIFICATION REQUEST END ---');
        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('FATAL ERROR in email API:', error);
        return NextResponse.json(
            { error: error.message || 'Error sending email' },
            { status: 500 }
        );
    }
}
