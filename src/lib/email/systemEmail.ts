import { createClient, createAdminClient } from '@/lib/supabase/server';
import nodemailer from 'nodemailer';

interface SendEmailParams {
    to: string;
    subject: string;
    html?: string;
    template_code?: string;
    variables?: Record<string, any>;
    attachments?: any[];
}

export async function sendSystemEmail({ to, subject, html, template_code, variables, attachments }: SendEmailParams) {
    console.log('--- SYSTEM EMAIL SENDING START ---');
    try {
        const supabase = await createClient();

        // 1. Resolve Template if code provided
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
                        html = html ? html.replace(regex, String(value)) : '';
                    });
                }
            }
        }

        if (!html) {
            throw new Error('No email content (html) provided or resolved from template');
        }

        // 2. Get Integration Config
        console.log('Fetching gmail integration...');
        const adminSupabase = await createAdminClient();
        const { data: integration, error } = await adminSupabase
            .from('integrations')
            .select('config')
            .eq('provider', 'gmail')
            .eq('is_active', true)
            .single();

        if (error || !integration) {
            throw new Error('No active email configuration found');
        }

        const config = integration.config as any;

        if (!config.email || !config.app_password) {
            throw new Error('Invalid email configuration: missing email or app_password');
        }

        // 3. Create Transporter
        const transporter = nodemailer.createTransport({
            host: config.smtp_host || 'smtp.gmail.com',
            port: config.smtp_port || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: config.email,
                pass: config.app_password,
            },
        });

        // 4. Send Email
        console.log(`Sending email to ${to}...`);
        const info = await transporter.sendMail({
            from: `"GestorPro System" <${config.email}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments || []
        });

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error: any) {
        console.error('Email Service Error:', error);
        throw error;
    }
}
