import './globals.css'
import Providers from '@/components/Providers'
import AppShell from '@/components/AppShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Math Dashboard',
  description: 'Painel de métricas e conteúdo das questões de matemática'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
