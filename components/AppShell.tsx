'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import clsx from 'clsx'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const showSidebar = status === 'authenticated'

  return (
    <div
      className={clsx(
        'flex min-h-screen transition-colors',
        showSidebar ? 'bg-orange-50 text-slate-900' : 'bg-gray-50 text-slate-900'
      )}
    >
      {showSidebar && <Sidebar />}
      <main
        className={clsx(
          'flex-1 p-6',
          showSidebar ? 'bg-orange-50' : 'bg-gray-50',
          showSidebar && 'md:pl-2'
        )}
      >
        {children}
      </main>
    </div>
  )
}
