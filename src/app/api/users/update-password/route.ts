import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { userId, newPassword } = await request.json();

        if (!userId || !newPassword) {
            return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
        }

        // 1. Verify Requestor is Admin
        const supabase = await createClient(); // Helper that gets session from cookies
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Check profile role
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

        return NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' });

    } catch (error: any) {
        console.error('Error updating password:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
