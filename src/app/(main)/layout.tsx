'use client';

import { AppLayout } from '@/shared/components/AppLayout';
import { SettingsProvider } from '@/shared/contexts/SettingsContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <AppLayout>{children}</AppLayout>
    </SettingsProvider>
  );
}
