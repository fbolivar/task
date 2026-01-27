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

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { profile } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Role-based access control - define allowed routes per role
    const roleName = profile?.role?.name || '';

    // Start background risk monitoring (Exclude Gerente)
    // Start background risk monitoring (Exclude Gerente)
    // We pass the flag inside the hook to avoid "Rules of Hooks" violation
    const shouldMonitorRisk = roleName !== 'Gerente';
    useRiskMonitor(shouldMonitorRisk);

    const roleRouteAccess: Record<string, string[]> = {
        'Admin': [], // Empty means all access
        'Gerente': ['/analisis', '/finanzas', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/contratacion', '/cambios'],
        'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/reportes', '/contratacion', '/cambios'],
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
                {/* Header */}
                <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-40">
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

                    <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/50 dark:border-white/5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
                        {roleName !== 'Gerente' && <NotificationDropdown />}
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                        <UserMenu />
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />
                        <ThemeToggle />
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
