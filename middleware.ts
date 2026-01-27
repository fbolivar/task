import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Prevent caching of auth-related redirects
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string, value: string, options: any }[]) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Route Protection
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
        // Redirect unauthenticated users to login
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (user) {
        // Check if user must change password (except on change-password page itself)
        if (request.nextUrl.pathname !== '/change-password' &&
            request.nextUrl.pathname !== '/login' &&
            !request.nextUrl.pathname.startsWith('/api')) {

            const { data: profile } = await supabase
                .from('profiles')
                .select('must_change_password, role:roles(name)')
                .eq('id', user.id)
                .single();

            if (profile?.must_change_password) {
                const url = request.nextUrl.clone();
                url.pathname = '/change-password';
                return NextResponse.redirect(url);
            }

            // Role-based route protection
            const roleData = (profile?.role as unknown) as { name: string } | null;
            const roleName = roleData?.name || '';
            const path = request.nextUrl.pathname;

            const roleRouteAccess: Record<string, string[]> = {
                'Gerente': ['/dashboard', '/finanzas', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/cambios'],
                'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/contratacion', '/reportes', '/cambios'],
            };

            // Check if route is restricted for this role
            if (roleName !== 'Admin' && roleName in roleRouteAccess) {
                const allowedRoutes = roleRouteAccess[roleName];
                const isAllowed = allowedRoutes.some(route => path === route || path.startsWith(route + '/'));

                // Block access to config pages not allowed for this role
                if (path.startsWith('/configuracion') && !isAllowed) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/dashboard';
                    return NextResponse.redirect(url);
                }

                // Block access to main routes not allowed for this role
                const mainRoutes = ['/entidades', '/proyectos', '/tareas', '/inventario', '/finanzas', '/dashboard', '/contratacion', '/cambios'];
                const isMainRoute = mainRoutes.some(route => path === route || path.startsWith(route + '/'));

                if (isMainRoute && !isAllowed) {
                    // Redirect to first allowed route
                    const url = request.nextUrl.clone();
                    url.pathname = allowedRoutes[0] || '/dashboard';
                    return NextResponse.redirect(url);
                }
            }
        }

        // Redirect authenticated users away from Login or Root to Dashboard
        if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/') {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - assets (public assets)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
