'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useReports } from '@/features/reports/hooks/useReports';
import { ReportHeader } from '@/features/reports/components/ReportHeader';
import { ReportBuilder, ReportType } from '@/features/reports/components/ReportBuilder';

import { useSettings } from '@/shared/contexts/SettingsContext';

export default function ReportesPage() {
    const { t } = useSettings();
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const [reportType, setReportType] = useState<ReportType>('executive');

    const {
        projects,
        stats,
        trendData,
        burndownData,
        resourceData,
        financialData,
        loading,
        generateStats
    } = useReports();

    // Protect Route
    useEffect(() => {
        if (!authLoading && profile) {
            const role = profile.role?.name;
            if (role !== 'Admin' && role !== 'Gerente') {
                router.replace('/dashboard');
            }
        }
    }, [profile, authLoading, router]);

    if (authLoading) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
            <ReportHeader />

            <section className="space-y-8">
                <ReportBuilder
                    projects={projects}
                    stats={stats}
                    burndownData={burndownData}
                    resourceData={resourceData}
                    financialData={financialData}
                    loading={loading}
                    onGenerate={async (filter: any) => {
                        await generateStats({
                            project_id: filter.projectId || filter.project_id,
                            start_date: filter.start || filter.start_date,
                            end_date: filter.end || filter.end_date,
                            status: filter.status,
                            priority: filter.priority,
                            assignee_id: filter.assignee_id
                        });
                    }}
                    activeType={reportType}
                    onTypeChange={setReportType}
                />


            </section>
        </div>
    );
}
