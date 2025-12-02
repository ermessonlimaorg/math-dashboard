'use client'

import { signIn } from 'next-auth/react'
import { FormEvent, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const params = useSearchParams()
  const callbackUrl = (() => {
    const raw = params.get('callbackUrl')
    if (!raw) return '/dashboard'
    try {
      const url = new URL(raw, window.location.href)
      return `${url.pathname}${url.search}${url.hash || ''}` || '/dashboard'
    } catch {
      return raw.startsWith('/') ? raw : '/dashboard'
    }
  })()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      toast.success('Logged in!')
      window.location.href = callbackUrl
    } else {
      toast.error('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form
        onSubmit={onSubmit}
        className="bg-orange-600 border border-orange-100 shadow-lg shadow-orange-200/60 rounded-xl p-6 w-full max-w-sm space-y-3"
      >
        <div className="flex flex-col items-center gap-3 mb-1">
          <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-xl border border-orange-100 bg-orange-50 object-cover" />
          <h1 className="text-xl font-semibold text-orange-600">Entrar</h1>
        </div>
        <label className="block text-sm">
          <span className="text-white">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="email@exemplo.com"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-white">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
            placeholder="••••••••"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-orange-500 text-white py-2 text-sm font-semibold disabled:opacity-50 hover:bg-orange-500 transition"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Carregando...</div>}>
      <SignInForm />
    </Suspense>
  )
}
