'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Settings, Home, Building2, Briefcase, CheckSquare, BarChart3, Package, DollarSign, X } from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const settings = useSettings();
    const { profile } = useAuth();
    const { t } = settings;

    const navItems = [
        { href: '/dashboard', label: t('nav.dashboard'), icon: Home },
        { href: '/entidades', label: t('nav.entities'), icon: Building2 },
        { href: '/proyectos', label: t('nav.projects'), icon: Briefcase },
        { href: '/tareas', label: t('nav.tasks'), icon: CheckSquare },
        { href: '/inventario', label: t('nav.inventory'), icon: Package },
        { href: '/reportes', label: t('nav.reports'), icon: BarChart3 },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`glass-sidebar fixed inset-y-0 left-0 z-50 w-72 min-h-screen p-6 flex flex-col transition-all duration-500 ease-spring md:translate-x-0 md:static md:h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } border-r border-white/10`}
            >
                {/* Logo & Close Button */}
                <div className="flex items-center justify-between mb-10 group">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${settings.header_color}, ${settings.header_color}dd)`,
                                boxShadow: `0 8px 16px -4px ${settings.header_color}40`
                            }}
                        >
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-xl">{settings.app_name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <h1 className="font-extrabold text-xl tracking-tight truncate leading-none mb-1">{settings.app_name}</h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary/70">Expert System</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-muted-foreground transition-all hover:rotate-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                    {(() => {
                        const roleName = profile?.role?.name || '';

                        // Define access per role
                        const roleAccess: Record<string, string[]> = {
                            'Admin': [], // Empty means all access
                            'Gerente': ['/dashboard', '/reportes'],
                            'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/reportes'],
                        };

                        return navItems
                            .filter(item => {
                                if (roleName === 'Admin') return true;
                                const allowedRoutes = roleAccess[roleName] || [];
                                return allowedRoutes.includes(item.href);
                            })
                            .map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${isActive
                                            ? 'text-white'
                                            : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                                            }`}
                                        style={isActive ? {
                                            backgroundColor: settings.header_color,
                                            boxShadow: `0 10px 20px -5px ${settings.header_color}60`
                                        } : {}}
                                    >
                                        <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={`font-semibold tracking-wide ${isActive ? 'translate-x-0' : ''}`}>{item.label}</span>
                                        {isActive && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20 rounded-l-full" />
                                        )}
                                    </Link>
                                );
                            });
                    })()}

                    <div className="h-px bg-slate-200/50 dark:bg-white/5 my-6 mx-4" />

                    {/* Settings Link - Only Admin and Gerente */}
                    {(profile?.role?.name === 'Admin' || profile?.role?.name === 'Gerente') && (
                        <Link
                            href="/configuracion"
                            onClick={onClose}
                            className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative overflow-hidden ${pathname.includes('/configuracion')
                                ? 'text-white'
                                : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                                }`}
                            style={pathname.includes('/configuracion') ? {
                                backgroundColor: settings.header_color,
                                boxShadow: `0 10px 20px -5px ${settings.header_color}60`
                            } : {}}
                        >
                            <Settings className={`w-5 h-5 flex-shrink-0 transition-transform duration-500 ${pathname.includes('/configuracion') ? 'rotate-90' : 'group-hover:rotate-45'}`} />
                            <span className="font-semibold tracking-wide">{t('nav.config')}</span>
                        </Link>
                    )}
                </nav>

                {/* Footer */}
                <div className="pt-6 mt-6 border-t border-slate-200/50 dark:border-white/5">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 mb-4 border border-primary/10">
                        <p className="text-[10px] text-primary/80 dark:text-primary/60 text-center font-bold uppercase tracking-wider">
                            {settings.footer_text}
                        </p>
                    </div>
                </div>
            </aside>
        </>
    );
}
