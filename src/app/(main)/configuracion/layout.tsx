'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

const tabs = [
    { href: '/configuracion/general', label: 'General', icon: Settings },
    { href: '/configuracion/usuarios', label: 'Usuarios y Permisos', icon: Users },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { profile } = useAuth();

    // Strict protection: Only admin can see ANY config page
    if (profile && profile.role?.name !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] glass-card p-12 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-foreground">Acceso Denegado</h2>
                <p className="text-muted-foreground mt-2">Solo los administradores registrados pueden gestionar la configuración del sistema.</p>
                <Link href="/dashboard" className="btn-primary mt-6">Volver al Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header (Shared) */}
            <div>
                <nav className="flex items-center space-x-1 border-b border-border pb-px mb-6 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="min-h-[600px]">
                {children}
            </div>
        </div>
    );
}
