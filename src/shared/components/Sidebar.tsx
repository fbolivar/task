'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/shared/contexts/SettingsContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Settings, Home, Building2, Briefcase, CheckSquare, BarChart3, Package, DollarSign } from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/entidades', label: 'Entidades', icon: Building2 },
    { href: '/proyectos', label: 'Proyectos', icon: Briefcase },
    { href: '/tareas', label: 'Tareas', icon: CheckSquare },
    { href: '/inventario', label: 'Inventario', icon: Package },
    { href: '/finanzas', label: 'Finanzas', icon: DollarSign },
    { href: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export function Sidebar() {
    const pathname = usePathname();
    const settings = useSettings();
    const { profile } = useAuth();

    return (
        <aside className="glass-sidebar w-64 min-h-screen p-4 flex flex-col transition-colors duration-300" style={{ borderRightColor: settings.header_color + '20' }}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-3 py-4 mb-6">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${settings.header_color}, #000000)` }}
                >
                    {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-white font-bold text-lg">{settings.app_name.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h1 className="font-bold text-lg truncate w-32">{settings.app_name}</h1>
                    <p className="text-xs text-muted-foreground">ERP Empresarial</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    const isGerente = profile?.role?.name === 'Gerente';
                    const isAdmin = profile?.role?.name === 'Admin';

                    // Strict Gerente restriction: Dashboard, Finance, Projects, Inventory, Reports, Auditoria
                    if (isGerente && !['/dashboard', '/finanzas', '/proyectos', '/inventario', '/reportes', '/configuracion/auditoria'].includes(item.href)) return null;

                    // Admin restriction for other specific modules if needed, 
                    // but for now, Gerente is the most restricted.
                    // Operativo presumably sees Projects/Tasks but not Entities (or as previously defined)
                    if (!isAdmin && !isGerente && item.href === '/entidades') return null;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                ? 'shadow-lg text-white font-medium'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                                }`}
                            style={isActive ? { backgroundColor: settings.header_color } : {}}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Settings Link */}
                {(profile?.role?.name === 'Admin' || profile?.role?.name === 'Gerente') && (
                    <Link
                        href="/configuracion"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mt-6 ${pathname.includes('/configuracion')
                            ? 'shadow-lg text-white font-medium'
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                        style={pathname.includes('/configuracion') ? { backgroundColor: settings.header_color } : {}}
                    >
                        <Settings className="w-5 h-5" />
                        <span>Configuración</span>
                    </Link>
                )}
            </nav>

            {/* Footer */}
            <div className="pt-4 border-t border-border mt-4">
                <p className="text-[10px] text-muted-foreground text-center px-2">
                    {settings.footer_text}
                </p>
            </div>
        </aside>
    );
}
