'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { es, en, TranslationKey } from '../locales/dictionaries';

interface AppSettings {
    app_name: string;
    logo_url: string | null;
    header_color: string;
    footer_text: string;
    language: 'es' | 'en';
}

interface SettingsContextType extends AppSettings {
    t: (key: TranslationKey) => string;
}

const defaultSettings: AppSettings = {
    app_name: 'SGP - Parques Nacionales',
    logo_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Logo_Parques_Nacionales_Naturales_de_Colombia.jpg',
    header_color: '#166A2F', // Forest Green
    footer_text: '© 2024 Parques Nacionales Naturales de Colombia',
    language: 'es'
};

const SettingsContext = createContext<SettingsContextType>({
    ...defaultSettings,
    t: (key) => key
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('app_settings').select('*').single();
            if (data) setSettings({ ...data, language: 'es' });
        };

        fetchSettings();

        // Optional: Realtime subscription
        const channel = supabase.channel('settings_update')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' },
                (payload: any) => {
                    setSettings(payload.new as AppSettings);
                })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const t = useCallback((key: TranslationKey): string => {
        const dict = settings.language === 'en' ? en : es;
        return dict[key] || key;
    }, [settings.language]);

    return (
        <SettingsContext.Provider value={{ ...settings, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
