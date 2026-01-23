'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AppSettings {
    app_name: string;
    logo_url: string | null;
    header_color: string;
    footer_text: string;
}

const defaultSettings: AppSettings = {
    app_name: 'GestorPro',
    logo_url: null,
    header_color: '#2563EB',
    footer_text: '© 2026 GestorPro'
};

const SettingsContext = createContext<AppSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('app_settings').select('*').single();
            if (data) setSettings(data);
        };

        fetchSettings();

        // Optional: Realtime subscription
        const channel = supabase.channel('settings_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' },
                (payload) => {
                    setSettings(payload.new as AppSettings);
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    return (
        <SettingsContext.Provider value={settings}>
            <style jsx global>{`
                :root {
                    --header-color: ${settings.header_color};
                }
            `}</style>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
