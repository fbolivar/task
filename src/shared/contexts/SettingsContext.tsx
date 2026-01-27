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

    // Helper to convert hex to HSL for Tailwind
    const hexToHsl = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '138 65% 25%'; // Fallback default

        let r = parseInt(result[1], 16);
        let g = parseInt(result[2], 16);
        let b = parseInt(result[3], 16);

        r /= 255; g /= 255; b /= 255;

        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const t = useCallback((key: TranslationKey): string => {
        const dict = settings.language === 'en' ? en : es;
        return dict[key] || key;
    }, [settings.language]);

    // Apply branding colors dynamically
    useEffect(() => {
        if (settings.header_color) {
            const hsl = hexToHsl(settings.header_color);
            document.documentElement.style.setProperty('--primary', hsl);
            document.documentElement.style.setProperty('--ring', hsl);
            // Optionally adjust foreground if needed, but white usually works for dark primaries
        }
    }, [settings.header_color]);

    return (
        <SettingsContext.Provider value={{ ...settings, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
