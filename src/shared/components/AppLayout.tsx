'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';
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
    const { profile, loading } = useAuth();
    const pathname = usePathname();

    // Start background risk monitoring
    useRiskMonitor();

    // Gerente Strict Access Control
    const isGerente = profile?.role?.name === 'Gerente';
    const allowedGerenteRoutes = ['/dashboard', '/reportes'];
    // Redirection check: If Gerente and trying to access a restricted module
    const isRestrictedRouteForGerente = isGerente && !allowedGerenteRoutes.some(route => pathname.startsWith(route));

    // UI for Restricted Access
    if (isRestrictedRouteForGerente) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                    <div className="glass-card p-12 max-w-lg w-full text-center flex flex-col items-center gap-6 border-t-4 border-t-orange-500 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center">
                            <Lock className="w-10 h-10 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-foreground">Acceso Restringido</h2>
                            <p className="text-muted-foreground mt-4 text-lg">
                                Tu rol de <strong>Gerente</strong> está configurado únicamente para supervisión mediante el <strong>Dashboard</strong> y el módulo de <strong>Reportes</strong>.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <Link href="/dashboard" className="btn-primary flex-1 py-4 text-center">Ir al Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <Sidebar />

            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="glass h-16 flex items-center justify-between px-6 sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block" />
                        <h2 className="font-bold text-lg text-foreground tracking-tight hidden sm:block">
                            {pathname === '/dashboard' ? 'Panel de Control' :
                                pathname.includes('/proyectos') ? 'Gestión de Proyectos' :
                                    pathname.includes('/tareas') ? 'Tablero de Tareas' :
                                        pathname.includes('/entidades') ? 'Ecosistema de Entidades' :
                                            pathname.includes('/reportes') ? 'Centro de Reportes' :
                                                pathname.includes('/configuracion') ? 'Configuración del Sistema' : 'Dashboard'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        <ThemeToggle />
                        <NotificationDropdown />
                        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                        <UserMenu />
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
