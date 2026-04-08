'use client';

import { useAuthStore } from '@/features/auth/store/authStore';
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';
import { GerenteDashboard } from '@/features/analytics/components/GerenteDashboard';

export default function AnalisisPage() {
    const { profile } = useAuthStore();
    const role = profile?.role?.name;

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {role === 'Gerente' ? <GerenteDashboard /> : <AnalyticsDashboard />}
        </div>
    );
}
