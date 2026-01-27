import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        if (userId === caller.id) {
            return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
        }

        // 3. Initialize Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey.includes('PEGA_AQUÍ')) {
            return NextResponse.json({
                error: 'Error de configuración en el servidor (falta Service Role Key)'
            }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Delete Profile (and cascading relations)
        // Public tables with references were updated via migration to SET NULL or CASCADE
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('Delete Profile Error:', profileError);
            return NextResponse.json({ error: `Error eliminando perfil: ${profileError.message}` }, { status: 500 });
        }

        // 5. Delete from Auth
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
            console.error('Delete Auth User Error:', authDeleteError);
            // We return success anyway because the profile is gone, but warn in logs
            return NextResponse.json({
                success: true,
                warning: 'Perfil eliminado, pero falló el borrado en Auth: ' + authDeleteError.message
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
