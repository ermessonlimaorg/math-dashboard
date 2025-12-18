'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  const showNav = status === 'authenticated' && !isAuthPage

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showNav && <Sidebar />}
      {showNav && <MobileNav />}
      <main className={`flex-1 ${showNav ? 'pt-16 md:pt-0' : ''}`}>
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
