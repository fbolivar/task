'use client';

import { ListFilter, Shield, History } from 'lucide-react';

export type AuditTab = 'general' | 'autogestion' | 'security';

interface AuditTabNavProps {
    activeTab: AuditTab;
    onTabChange: (tab: AuditTab) => void;
}

export function AuditTabNav({ activeTab, onTabChange }: AuditTabNavProps) {
    const tabClass = (tab: AuditTab) =>
        `pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === tab
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
        }`;

    return (
        <div className="flex gap-4 border-b border-border overflow-x-auto">
            <button
                onClick={() => onTabChange('general')}
                className={tabClass('general')}
            >
                <ListFilter className="w-4 h-4" />
                Log General
            </button>
            <button
                onClick={() => onTabChange('security')}
                className={tabClass('security')}
            >
                <Shield className="w-4 h-4" />
                Log de Seguridad
            </button>
            <button
                onClick={() => onTabChange('autogestion')}
                className={tabClass('autogestion')}
            >
                <History className="w-4 h-4" />
                Autogestión
            </button>
        </div>
    );
}
