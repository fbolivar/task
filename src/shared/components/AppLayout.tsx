'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationDropdown } from '@/features/notifications/components/NotificationDropdown';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRiskMonitor } from '@/shared/hooks/useRiskMonitor';
import { useIdleTimeout } from '@/shared/hooks/useIdleTimeout';
import { createClient } from '@/lib/supabase/client';

interface AppLayoutProps {
    children: React.ReactNode;
}

import { useScrollDirection } from '@/shared/hooks/useScrollDirection';

// ... imports remain the same

export function AppLayout({ children }: AppLayoutProps) {
    const { profile, signOut } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scrollDirection = useScrollDirection();
    const [expiryMinutes, setExpiryMinutes] = useState(0);

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

    // Handle Idle Timeout
    useIdleTimeout(expiryMinutes, () => {
        // Optional: Can use a fancier modal/toast here
        // For now, simple alert and redirect
        // We use a small timeout to allow the alert to show before unmounting potentially
        // But alert blocks thread, so it's fine.
        alert('Tu sesión ha expirado debido a inactividad.');
        signOut();
    });

    // Role-based access control - define allowed routes per role
    const roleName = profile?.role?.name || '';

    // Start background risk monitoring (Exclude Gerente)
    const shouldMonitorRisk = roleName !== 'Gerente';
    useRiskMonitor(shouldMonitorRisk);

    const roleRouteAccess: Record<string, string[]> = {
        'Admin': [], // Empty means all access
        'Gerente': ['/analisis', '/finanzas', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/contratacion', '/cambios'],
        'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/contratacion', '/cambios'],
    };

    // Check if current route is allowed for this role
    const allowedRoutes = roleRouteAccess[roleName] || [];
    const isRestrictedRoute = roleName !== 'Admin' && roleName in roleRouteAccess &&
        !allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    // Silent redirect for unauthorized routes
    useEffect(() => {
        if (profile && isRestrictedRoute) {
            const defaultRoute = allowedRoutes[0] || '/dashboard';
            router.replace(defaultRoute);
        }
    }, [profile, isRestrictedRoute, allowedRoutes, router]);

    // Don't render anything while redirecting
    if (profile && isRestrictedRoute) {
        return null;
    }

    return (
        <div className="flex min-h-screen mesh-gradient text-foreground transition-colors duration-500">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Smart Header - Hide on scroll down, Show on scroll up */}
                <header className={`h-20 flex items-center justify-between px-6 sticky top-0 z-40 transition-transform duration-300 ${scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'}`}>
                    {/* Glass background separate div to avoid conflict with transform if needed, or just on header */}
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-indigo-500/10 dark:border-indigo-400/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)]" />

                    {/* Href content container relative z-10 */}
                    <div className="relative z-10 w-full flex items-center justify-between">
                        <div className="flex items-center gap-6 overflow-hidden">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 md:hidden shadow-sm transition-all"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="h-6 w-[2px] bg-primary/30 hidden md:block rounded-full" />
                                <h2 className="font-bold text-2xl tracking-tighter text-foreground truncate">
                                    {pathname === '/dashboard' ? 'Panel de Control' :
                                        pathname.includes('/proyectos') ? 'Gestión de Proyectos' :
                                            pathname.includes('/tareas') ? 'Tablero de Tareas' :
                                                pathname.includes('/entidades') ? 'Ecosistema de Entidades' :
                                                    pathname.includes('/reportes') ? 'Centro de Reportes' :
                                                        pathname.includes('/configuracion') ? 'Ajustes del Sistema' : 'Resumen'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 dark:border-white/5 transition-all duration-300">
                            {roleName !== 'Gerente' && <NotificationDropdown />}
                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                            <UserMenu />
                            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 animate-reveal">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
