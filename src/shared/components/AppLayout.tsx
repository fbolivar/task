'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from './GlobalSearch';
import { WelcomeModal } from './WelcomeModal';
import { SessionWarning } from './SessionWarning';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import { QuickAddTask } from './QuickAddTask';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRiskMonitor } from '@/shared/hooks/useRiskMonitor';
import { useIdleTimeout } from '@/shared/hooks/useIdleTimeout';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
    children: React.ReactNode;
}

/** Maps a pathname to a human-readable page title. */
function getPageTitle(pathname: string): string {
    if (pathname === '/dashboard') return 'Panel de Control';
    if (pathname.startsWith('/proyectos')) return 'Gestión de Proyectos';
    if (pathname.startsWith('/tareas')) return 'Tablero de Tareas';
    if (pathname.startsWith('/entidades')) return 'Ecosistema de Entidades';
    if (pathname.startsWith('/reportes')) return 'Centro de Reportes';
    if (pathname.startsWith('/configuracion')) return 'Ajustes del Sistema';
    if (pathname.startsWith('/inventario')) return 'Inventario';
    if (pathname.startsWith('/analisis')) return 'Análisis';
    if (pathname.startsWith('/contratacion')) return 'Contratación';
    return 'Resumen';
}

export function AppLayout({ children }: AppLayoutProps) {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expiryMinutes, setExpiryMinutes] = useState(0);
    const [showSessionWarning, setShowSessionWarning] = useState(false);

    // Fetch session expiry setting
    useEffect(() => {
        const fetchSecuritySettings = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('security_settings')
                .select('session_expiry_minutes')
                .single();

            if (data?.session_expiry_minutes) {
                setExpiryMinutes(data.session_expiry_minutes);
            }
        };

        if (profile) {
            fetchSecuritySettings();
        }
    }, [profile]);

    const handleIdleWarning = useCallback(() => {
        setShowSessionWarning(true);
    }, []);

    const handleContinueSession = useCallback(() => {
        setShowSessionWarning(false);
        // Touching the DOM resets the activity timer via the existing event listeners
        window.dispatchEvent(new MouseEvent('mousemove'));
    }, []);

    // Handle Idle Timeout
    useIdleTimeout(
        expiryMinutes,
        () => {
            setShowSessionWarning(false);
            alert('Tu sesión ha expirado debido a inactividad.');
            signOut();
        },
        handleIdleWarning,
    );

    const roleName = profile?.role?.name || '';

    // Start background risk monitoring (Exclude Gerente)
    const shouldMonitorRisk = roleName !== 'Gerente';
    useRiskMonitor(shouldMonitorRisk);

    // Role-based access control
    const roleRouteAccess: Record<string, string[]> = {
        'Admin': [],
        'Gerente': ['/analisis', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/contratacion', '/perfil'],
        'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/contratacion', '/reportes', '/perfil'],
    };

    const allowedRoutes = roleRouteAccess[roleName] || [];
    const isRestrictedRoute = roleName !== 'Admin' && roleName in roleRouteAccess &&
        !allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    useEffect(() => {
        if (profile && isRestrictedRoute) {
            const defaultRoute = allowedRoutes[0] || '/dashboard';
            router.replace(defaultRoute);
        }
    }, [profile, isRestrictedRoute, allowedRoutes, router]);

    if (profile && isRestrictedRoute) {
        return null;
    }

    const pageTitle = getPageTitle(pathname);

    return (
        <div className="flex min-h-screen mesh-gradient text-foreground">
            {/* First-login welcome modal */}
            {profile?.id && <WelcomeModal userId={profile.id} />}

            {/* Session expiry warning banner */}
            {showSessionWarning && (
                <SessionWarning
                    onContinue={handleContinueSession}
                    onDismiss={() => setShowSessionWarning(false)}
                />
            )}

            {/* Dark icon sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content column */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar */}
                <header className="flex items-center justify-between px-6 md:px-8 py-4 sticky top-0 z-40 bg-[hsl(var(--background))]/80 backdrop-blur-sm">
                    {/* Left: mobile hamburger + greeting */}
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            aria-label="Abrir menu de navegacion"
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--muted))] transition-all md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div>
                            <h1 className="font-bold text-lg text-foreground">
                                Hola, {profile?.full_name?.split(' ')[0] || 'Usuario'}
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Right: search + actions */}
                    <div className="flex items-center gap-3">
                        <GlobalSearch />

                        <div className="flex items-center gap-2">
                            <NotificationDropdown />
                            <ThemeToggle />
                            <UserMenu />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 px-8 py-6 animate-reveal">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global floating quick-add button (all pages) */}
            <QuickAddTask />
        </div>
    );
}
