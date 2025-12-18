'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const showNav = status === 'authenticated'

  return (
    <div className="flex min-h-screen bg-slate-50">
      {showNav && <Sidebar />}
      {showNav && <MobileNav />}
      <main className={`flex-1 ${showNav ? 'pt-16 md:pt-0' : ''}`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
