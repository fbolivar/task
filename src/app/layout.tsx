import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/shared/contexts/SettingsContext';
import { ToastProvider } from '@/shared/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'GestorPro | ERP Empresarial',
  description: 'Plataforma Inteligente de Gestion Empresarial - Proyectos, Tareas, Inventario, Contratacion y mas.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'GestorPro | ERP Empresarial',
    description: 'Plataforma Inteligente de Gestion Empresarial',
    type: 'website',
    locale: 'es_CO',
    siteName: 'GestorPro',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`} style={{ scrollBehavior: 'smooth' }} data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#166A2F" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased font-sans bg-background text-foreground selection:bg-primary/20">
        <SettingsProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
