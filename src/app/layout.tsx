import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { SettingsProvider } from '@/shared/contexts/SettingsContext';

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
  description: 'Plataforma Inteligente de Gestión Empresarial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="antialiased font-sans bg-background text-foreground selection:bg-primary/20">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  )
}
