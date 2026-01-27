'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { sendSystemEmail } from '@/lib/email/systemEmail';

export async function requestPasswordResetAction(email: string) {
    try {
        const supabase = await createAdminClient();

        // 1. Generate Link
        // Need to define the redirect URL. Usually the update password page.
        // If the user clicks the link, they are logged in and tokens are exchanged.
        // We set redirect to /dashboard or a settings page where they can change the password.
        const getBaseUrl = () => {
            if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
            if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
            return 'http://localhost:3000';
        };

        const redirectTo = `${getBaseUrl()}/dashboard`;

        // 0. Check if user exists in Profiles
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profileError || !userProfile) {
            console.warn(`Password reset requested for non-existent email: ${email}`);
            return {
                success: false,
                error: 'El correo no es válido. Por favor ingrese un correo del sistema.'
            };
        }

        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'recovery',
            email,
            options: {
                redirectTo
            }
        });

        if (error) {
            console.error('Error generating recovery link:', error);
            throw new Error(error.message);
        }

        const { properties } = data; // action_link is in data.properties.action_link // No, data.properties is only for generateLink?
        // Wait, admin.generateLink type definition:
        // returns { data: { user, properties: { action_link, email_otp, hashed_token, ... } }, error }

        const actionLink = data.properties?.action_link;

        if (!actionLink) {
            throw new Error('Could not generate recovery link');
        }

        // 2. Send Email
        // We use a template code 'PASSWORD_RECOVERY'. 
        // We provide a default HTML in case the template is not in DB yet.
        await sendSystemEmail({
            to: email,
            subject: 'Recuperación de Contraseña - GestorPro',
            template_code: 'PASSWORD_RECOVERY',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Recuperación de Contraseña</h1>
                    <p>Has solicitado restablecer tu contraseña en GestorPro.</p>
                    <p>Usa el siguiente enlace para acceder y crear una nueva contraseña:</p>
                    <p>
                        <a href="${actionLink}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Restablecer Contraseña
                        </a>
                    </p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">
                        Si no solicitaste esto, puedes ignorar este correo.
                    </p>
                </div>
            `,
            variables: {
                action_link: actionLink,
                email: email
            }
        });

        return { success: true };

    } catch (error: any) {
        console.error('Password reset action error:', error);
        return { success: false, error: error.message };
    }
}
