'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import OnboardingTour from './OnboardingTour'
import HelpButton from './HelpButton'

export default function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()
  const isAuthPage = pathname === '/signin' || pathname === '/signup'
  const [runTour, setRunTour] = useState(false)
  const [showHelpButton, setShowHelpButton] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && pathname === '/dashboard') {
      const tourCompleted = localStorage.getItem('mathdash-tour-completed')
      const isDesktop = window.innerWidth >= 768
      if (!tourCompleted && isDesktop) {
        setTimeout(() => setRunTour(true), 1000)
      }
      setShowHelpButton(true)
    } else if (status === 'authenticated') {
      setShowHelpButton(true)
    }
  }, [status, pathname])

  const handleStartTour = () => {
    const isDesktop = window.innerWidth >= 768
    if (isDesktop) {
      setRunTour(true)
    } else {
      alert('O tour guiado funciona melhor em telas maiores. Por favor, acesse pelo computador para ver o tour completo.')
    }
  }

  const handleFinishTour = () => {
    setRunTour(false)
  }
  
  if (isAuthPage) {
    return <>{children}</>
  }

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const showNav = isAuthenticated || isLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200/60">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-slate-900">MathDash</h1>
                <p className="text-xs text-slate-500">Gerador de Questões</p>
              </div>
            </div>
          </div>
          <div className="flex-1 p-4 space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </aside>
        <header className="md:hidden fixed top-0 left-0 right-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900">MathDash</span>
          </div>
          <div className="w-6 h-6 bg-slate-200 rounded animate-pulse" />
        </header>
        <main className="flex-1 pt-16 md:pt-0">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
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
      {showHelpButton && <HelpButton onClick={handleStartTour} />}
      <OnboardingTour run={runTour} onFinish={handleFinishTour} />
    </div>
  )
}
