'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
    Settings, Home, Building2, Briefcase, CheckSquare,
    BarChart3, Package, X, Target, PieChart,
} from 'lucide-react';

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
        { href: '/dashboard',    label: 'Inicio',        icon: Home },
        { href: '/entidades',    label: 'Empresas',      icon: Building2 },
        { href: '/proyectos',    label: 'Proyectos',     icon: Briefcase },
        { href: '/tareas',       label: 'Tareas',        icon: CheckSquare },
        { href: '/inventario',   label: 'Activos',       icon: Package },
        { href: '/analisis',     label: 'Análisis',      icon: PieChart },
        { href: '/contratacion', label: 'Contratación',  icon: Target },
        { href: '/reportes',     label: 'Reportes',      icon: BarChart3 },
    ];

    const roleName = profile?.role?.name || '';

    const roleAccess: Record<string, string[]> = {
        'Admin': [],
        'Gerente': ['/analisis', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/contratacion', '/perfil'],
        'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/contratacion', '/reportes', '/perfil'],
    };

    const visibleItems = navItems.filter(item => {
        if (item.href === '/contratacion') return true;
        if (roleName === 'Admin') return true;
        const allowed = roleAccess[roleName] || [];
        return allowed.includes(item.href);
    });

    const isSettingsActive = pathname.includes('/configuracion');

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile drawer */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 flex flex-col
                bg-[#2D6A5A] transition-transform duration-300 ease-out md:hidden
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <CheckSquare className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <span className="text-white font-bold text-sm">{settings.app_name}</span>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Cerrar menu" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {visibleItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    {roleName === 'Admin' && (
                        <>
                            <div className="h-px bg-white/10 my-2" />
                            <Link
                                href="/configuracion"
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isSettingsActive ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Settings className="w-4.5 h-4.5 flex-shrink-0" />
                                <span>Ajustes</span>
                            </Link>
                        </>
                    )}
                </nav>
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:flex-col md:w-56 md:sticky md:top-0 md:h-screen bg-[#2D6A5A] flex-shrink-0">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <CheckSquare className="w-4 h-4 text-white" />
                            )}
                        </div>
                        <span className="text-white font-bold text-sm truncate">{settings.app_name}</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                    {visibleItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings (Admin only) */}
                {roleName === 'Admin' && (
                    <div className="px-3 py-3 border-t border-white/10">
                        <Link
                            href="/configuracion"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                                isSettingsActive ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Settings className={`w-[18px] h-[18px] flex-shrink-0 transition-transform ${isSettingsActive ? 'rotate-90' : ''}`} />
                            <span>Ajustes</span>
                        </Link>
                    </div>
                )}
            </aside>
        </>
    );
}
