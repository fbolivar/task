'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Users, ShieldAlert, History, Link2 as LinkIcon, FileText, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const tabs = [
    { href: '/configuracion/general', label: 'General', icon: Settings },
    { href: '/configuracion/integraciones', label: 'Integraciones', icon: LinkIcon },
    { href: '/configuracion/templates', label: 'Plantillas', icon: FileText },
    { href: '/configuracion/seguridad', label: 'Seguridad', icon: ShieldAlert },
    { href: '/configuracion/politicas', label: 'Políticas de Riesgo', icon: AlertTriangle },
    { href: '/configuracion/auditoria', label: 'Log de Auditoría', icon: History },
    { href: '/configuracion/usuarios', label: 'Usuarios y Permisos', icon: Users },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useAuth();

    // Strict protection: Only admin/gerente can see CONFIG pages.
    // Assuming mostly Admin, but Gerente might need to see some? User request implied coherence.
    // Ideally this logic should match Sidebar. Sidebar allows Admin and Gerente.
    // Let's stick to the existing check or refine it.
    // Original layout had strict Adming check.
    // Sidebar.tsx says: {(profile?.role?.name === 'Admin' || profile?.role?.name === 'Gerente') && ... }
    // So Gerente CAN access /configuracion.
    // But layout.tsx strictly blocked non-Admin? 
    // "Strict protection: Only admin can see ANY config page" -> This contradicts Sidebar.
    // I will relax it to include Gerente based on Sidebar logic, but verify if Gerente should see everything.
    // The previous layout said `if (profile && profile.role?.name !== 'Admin')`. 
    // I'll update it to allow Gerente too, or consistent with Sidebar.

    const canAccess = profile?.role?.name === 'Admin' || profile?.role?.name === 'Gerente';

    // Redirect unauthorized users silently
    useEffect(() => {
        if (profile && !canAccess) {
            router.replace('/dashboard');
        }
    }, [profile, canAccess, router]);

    // Don't render anything while redirecting
    if (profile && !canAccess) {
        return null;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent uppercase tracking-tight">
                    Configuración del Sistema
                </h1>
                <p className="text-muted-foreground mt-1">Administra la identidad, políticas de riesgo, usuarios y auditoría del ecosistema</p>
            </div>

            {/* Tabs Navigation */}
            <nav className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
                {tabs
                    .filter(tab => {
                        const roleName = profile?.role?.name;
                        if (roleName === 'Admin') return true;
                        if (roleName === 'Gerente') {
                            // Gerente only sees Políticas, Auditoría, Templates
                            return ['/configuracion/politicas', '/configuracion/auditoria', '/configuracion/templates'].includes(tab.href);
                        }
                        return false;
                    })
                    .map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
            </nav>

            {/* Content */}
            <div className="min-h-[500px]">
                {children}
            </div>
        </div>
    );
}
