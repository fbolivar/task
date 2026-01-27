import { createClient } from '@/lib/supabase/client';

export const notificationService = {
    async notifyWithTemplate(to: string, templateCode: string, variables: Record<string, string>, attachments?: any[]) {
        try {
            const supabase = createClient();

            // 1. Fetch template
            const { data: template, error } = await supabase
                .from('email_templates')
                .select('*')
                .eq('code', templateCode)
                .eq('is_active', true)
                .single();

            if (error || !template) {
                console.warn(`Template ${templateCode} not found or inactive. Falling back to default notification.`);
                return;
            }

            // 2. Replace variables in Subject and Body
            let subject = template.subject || '';
            let html = template.body_html || '';

            Object.entries(variables).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                subject = subject.replace(regex, value);
                html = html.replace(regex, value);
            });

            // 3. Send email via local API
            const response = await fetch('/api/notifications/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to,
                    subject,
                    html,
                    attachments
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to send email');
            }

            return await response.json();

        } catch (error) {
            console.error(`Error sending notification with template ${templateCode}:`, error);
        }
    }
};
