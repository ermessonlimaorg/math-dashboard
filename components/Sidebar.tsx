/* eslint-disable @next/next/no-img-element */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { signOut } from 'next-auth/react'

const nav = [
  { href: '/dashboard', label: 'Painel' },
  { href: '/questions', label: 'Questões' },
  { href: '/feedback', label: 'Feedbacks' },
  { href: '/avaliacao', label: 'Avaliação IA' }
]

export default function Sidebar() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    window.location.href = '/signin'
  }

  return (
    <aside className="hidden md:flex w-64 flex-col bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-lg">
      <div className="p-5 text-xl font-semibold tracking-tight flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-cover" />
        <span>Gerador de questões</span>
      </div>
      <nav className="px-3 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block rounded-md px-3 py-2 text-sm transition hover:bg-white/10',
              pathname.startsWith(item.href) ? 'bg-white/10 font-semibold text-white shadow-sm' : 'text-white/80'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <button
          className="w-full rounded-md bg-white text-orange-600 py-2 text-sm font-semibold shadow-sm hover:bg-orange-50 transition"
          onClick={handleSignOut}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
