'use client';

import { useState } from 'react';
import { ReassignmentAuditPanel } from '@/features/entities/components/ReassignmentAuditPanel';
import { AuditTabNav, AuditTab } from '@/features/audit/components/AuditTabNav';
import { GeneralAuditLog } from '@/features/audit/components/GeneralAuditLog';
import { SecurityAuditLog } from '@/features/audit/components/SecurityAuditLog';

export default function AuditoriaPage() {
    const [activeTab, setActiveTab] = useState<AuditTab>('general');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <AuditTabNav activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'general' && <GeneralAuditLog />}
            {activeTab === 'security' && <SecurityAuditLog />}
            {activeTab === 'autogestion' && <ReassignmentAuditPanel />}
        </div>
    );
}
