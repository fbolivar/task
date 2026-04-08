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
        { href: '/dashboard',    label: t('nav.dashboard'),  icon: Home },
        { href: '/entidades',    label: t('nav.entities'),   icon: Building2 },
        { href: '/proyectos',    label: t('nav.projects'),   icon: Briefcase },
        { href: '/tareas',       label: t('nav.tasks'),      icon: CheckSquare },
        { href: '/inventario',   label: t('nav.inventory'),  icon: Package },
        { href: '/analisis',     label: 'Análisis',          icon: PieChart },
        { href: '/contratacion', label: t('nav.hiring'),     icon: Target },
        { href: '/reportes',     label: t('nav.reports'),    icon: BarChart3 },
    ];

    const roleName = profile?.role?.name || '';

    const roleAccess: Record<string, string[]> = {
        'Admin': [],
        'Gerente': ['/analisis', '/finanzas', '/reportes', '/configuracion/politicas', '/configuracion/auditoria', '/contratacion', '/perfil'],
        'Operativo': ['/dashboard', '/proyectos', '/tareas', '/inventario', '/contratacion', '/reportes', '/perfil'],
    };

    const visibleItems = navItems.filter(item => {
        if (item.href === '/contratacion') return true;
        if (roleName === 'Admin') return true;
        const allowed = roleAccess[roleName] || [];
        return allowed.includes(item.href);
    });

    const isSettingsActive = pathname.includes('/configuracion');

    const iconButton = (href: string, label: string, Icon: React.ElementType, isActive: boolean) => (
        <div key={href} className="relative group/tooltip">
            <Link
                href={href}
                onClick={onClose}
                aria-label={label}
                className={`
                    flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200
                    ${isActive
                        ? 'bg-[#FF6B35] text-white shadow-[0_4px_12px_rgba(255,107,53,0.4)]'
                        : 'text-[#888] hover:text-white hover:bg-white/10'
                    }
                `}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
            </Link>
            {/* Tooltip */}
            <div className="
                pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                hidden md:block
                bg-[#2a2a2a] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
                whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100
                translate-x-1 group-hover/tooltip:translate-x-0
                transition-all duration-150 z-50
                shadow-lg
            ">
                {label}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#2a2a2a]" />
            </div>
        </div>
    );

    /* ── Mobile full-width drawer ── */
    const MobileDrawer = () => (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-72 flex flex-col
                    bg-[#1c1c1c] border-r border-[#2a2a2a]
                    transition-transform duration-300 ease-out md:hidden
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <span className="text-white font-black text-base">{settings.app_name.charAt(0)}</span>
                            )}
                        </div>
                        <span className="text-white font-bold text-base truncate">{settings.app_name}</span>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        className="p-2 rounded-xl text-[#888] hover:text-white hover:bg-white/10 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {visibleItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-2xl
                                    text-sm font-semibold transition-all duration-200
                                    ${isActive
                                        ? 'bg-[#FF6B35] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)]'
                                        : 'text-[#888] hover:text-white hover:bg-white/8'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="h-px bg-[#2a2a2a] my-3 mx-2" />

                    {roleName === 'Admin' && (
                        <Link
                            href="/configuracion"
                            onClick={onClose}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-2xl
                                text-sm font-semibold transition-all duration-200
                                ${isSettingsActive
                                    ? 'bg-[#FF6B35] text-white shadow-[0_4px_12px_rgba(255,107,53,0.35)]'
                                    : 'text-[#888] hover:text-white hover:bg-white/8'
                                }
                            `}
                        >
                            <Settings className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isSettingsActive ? 'rotate-90' : ''}`} />
                            <span>{t('nav.config')}</span>
                        </Link>
                    )}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-[#2a2a2a]">
                    <p className="text-[10px] text-[#555] text-center font-semibold uppercase tracking-widest">
                        {settings.footer_text}
                    </p>
                </div>
            </aside>
        </>
    );

    /* ── Desktop icon-only sidebar ── */
    return (
        <>
            <MobileDrawer />

            {/* Desktop sidebar — always visible, icon-only, 72px wide */}
            <aside
                className="hidden md:flex flex-col items-center glass-sidebar w-[72px] min-h-screen flex-shrink-0 sticky top-0 h-screen py-5 z-30"
            >
                {/* Logo */}
                <div className="mb-8 flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6B35] flex items-center justify-center shadow-[0_4px_12px_rgba(255,107,53,0.4)]">
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <span className="text-white font-black text-lg">{settings.app_name.charAt(0)}</span>
                        )}
                    </div>
                </div>

                {/* Nav icons */}
                <nav className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full px-3">
                    {visibleItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return iconButton(item.href, item.label, item.icon, isActive);
                    })}

                    <div className="w-8 h-px bg-[#2a2a2a] my-3" />

                    {roleName === 'Admin' && iconButton('/configuracion', t('nav.config'), Settings, isSettingsActive)}
                </nav>

                {/* User avatar at bottom */}
                <div className="mt-4 flex-shrink-0">
                    <div className="relative group/tooltip">
                        <div
                            className="w-9 h-9 rounded-full bg-[#2a2a2a] border-2 border-[#3a3a3a] flex items-center justify-center cursor-default"
                            aria-label={profile?.full_name || 'Usuario'}
                        >
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name || 'Avatar'}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <span className="text-[#888] text-xs font-bold">
                                    {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        {/* Tooltip */}
                        <div className="
                            pointer-events-none absolute left-full ml-3 bottom-0
                            bg-[#2a2a2a] text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
                            whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100
                            translate-x-1 group-hover/tooltip:translate-x-0
                            transition-all duration-150 z-50 shadow-lg
                        ">
                            {profile?.full_name || 'Usuario'}
                            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#2a2a2a]" />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
