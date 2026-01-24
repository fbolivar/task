import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { email, password, to } = await request.json();

        if (!email || !password || !to) {
            return NextResponse.json(
                { error: 'Faltan credenciales (email, password) o destinatario (to)' },
                { status: 400 }
            );
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: email,
                pass: password,
            },
        });

        const mailOptions = {
            from: `"GestorPro Test" <${email}>`,
            to: to,
            subject: 'Prueba de Conexión - GestorPro',
            text: '¡Éxito! Tu integración con Gmail en GestorPro está funcionando correctamente.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563EB;">¡Conexión Exitosa!</h2>
                    <p>Hola,</p>
                    <p>Este correo confirma que la integración de <strong>Gmail</strong> con <strong>GestorPro</strong> se ha configurado correctamente.</p>
                    <p>Ya puedes enviar notificaciones automáticas desde el sistema.</p>
                    <br/>
                    <p style="font-size: 12px; color: #666;">Enviado automáticamente por GestorPro System</p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
        console.error('Error sending test email:', error);
        return NextResponse.json(
            { error: error.message || 'Error desconocido al enviar el correo' },
            { status: 500 }
        );
    }
}
