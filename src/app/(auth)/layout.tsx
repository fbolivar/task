'use client';

import { SettingsProvider } from '@/shared/contexts/SettingsContext';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SettingsProvider>
      {children}
    </SettingsProvider>
  );
}
